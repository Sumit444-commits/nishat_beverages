import express from "express";
import { User } from "../models/User.js";
import { Customer } from "../models/Customer.js";
import { Salesman } from "../models/Salesman.js";
import { AreaAssignment } from "../models/AreaAssignment.js";
import bcrypt from "bcryptjs"
const router = express.Router();


router.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  const dbName = mongoose.connection.db?.databaseName || 'Not connected';
  
  res.json({ 
    status: 'OK',
    server: 'Running',
    database: {
      status: dbStatus,
      name: dbName,
      host: mongoose.connection.host || 'N/A',
      readyState: mongoose.connection.readyState
    },
    timestamp: new Date().toISOString()
  });
});

// ========== AUTH ROUTES ========== //
router.post('/auth/signup', async (req, res) => {
  try {
    console.log('📝 Signup attempt:', { 
      name: req.body.name, 
      email: req.body.email,
      phone: req.body.phone 
    });
    
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: 'admin'
    });

    await user.save();
    console.log('✅ User created successfully:', user.email);

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Signup error:', error.message);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { identifier, password, email, phone } = req.body;
    console.log(email, "I called by login attempted!")
    console.log('🔑 Login attempt received:', { identifier, email, phone });

    let loginField, loginValue;
    
    if (identifier) {
      if (identifier.includes('@')) {
        loginField = 'email';
        loginValue = identifier.toLowerCase();
      } else {
        loginField = 'phone';
        loginValue = identifier;
      }
    } else if (email) {
      loginField = 'email';
      loginValue = email.toLowerCase();
    } else if (phone) {
      loginField = 'phone';
      loginValue = phone;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or phone number'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    const query = { [loginField]: loginValue };
    const user = await User.findOne(query);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email/phone and password.'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email/phone and password.'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    console.log(`✅ Login successful: ${user.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

router.get('/auth/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

router.post('/auth/create-admin', async (req, res) => {
  try {
    const adminExists = await User.findOne({ email: 'admin@nishat.com' });
    
    if (adminExists) {
      return res.json({
        success: false,
        message: 'Admin user already exists',
        email: adminExists.email
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@nishat.com',
      phone: '+923001234567',
      password: hashedPassword,
      role: 'admin'
    });

    await adminUser.save();

    const { password, ...adminResponse } = adminUser.toObject();

    res.status(201).json({
      success: true,
      message: 'Default admin created successfully',
      user: adminResponse,
      testCredentials: {
        email: 'admin@nishat.com',
        phone: '+923001234567',
        password: 'admin123'
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin user'
    });
  }
});

// ========== CUSTOMER ROUTES ========== //
router.get('/customers', async (req, res) => {
  try {
    const { 
      area, 
      salesmanId, 
      search, 
      page = 1, 
      limit = 20,
      active = 'true'
    } = req.query;
    
    const query = { isActive: active === 'true' };
    
    if (area && area !== 'all' && area !== '') {
      query.area = area;
    }
    
    if (salesmanId && salesmanId !== 'all' && salesmanId !== '') {
      query.salesmanId = salesmanId;
    }
    
    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { area: { $regex: search, $options: 'i' } }
      ];
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const total = await Customer.countDocuments(query);
    
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    const formattedCustomers = customers.map(customer => ({
      id: customer._id,
      _id: customer._id,
      name: customer.name,
      address: customer.address,
      mobile: customer.mobile,
      area: customer.area,
      salesmanId: customer.salesmanId,
      totalBalance: customer.totalBalance,
      totalBottlesPurchased: customer.totalBottlesPurchased,
      deliveryFrequencyDays: customer.deliveryFrequencyDays,
      emptyBottlesHeld: customer.emptyBottlesHeld,
      lastEmptiesCollectionDate: customer.lastEmptiesCollectionDate ? 
        customer.lastEmptiesCollectionDate.toISOString() : null,
      notes: customer.notes || '',
      isActive: customer.isActive,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString()
    }));
    
    res.json({
      success: true,
      data: formattedCustomers,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
    
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

router.get('/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    const formattedCustomer = {
      id: customer._id,
      _id: customer._id,
      name: customer.name,
      address: customer.address,
      mobile: customer.mobile,
      area: customer.area,
      salesmanId: customer.salesmanId,
      totalBalance: customer.totalBalance,
      totalBottlesPurchased: customer.totalBottlesPurchased,
      deliveryFrequencyDays: customer.deliveryFrequencyDays,
      emptyBottlesHeld: customer.emptyBottlesHeld,
      lastEmptiesCollectionDate: customer.lastEmptiesCollectionDate ? 
        customer.lastEmptiesCollectionDate.toISOString() : null,
      notes: customer.notes || '',
      isActive: customer.isActive,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString()
    };
    
    res.json({
      success: true,
      data: formattedCustomer
    });
    
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

router.post('/customers', async (req, res) => {
  try {
    console.log('📝 Creating new customer:', req.body);
    
    const {
      name,
      address,
      mobile,
      area,
      salesmanId,
      totalBalance = 0,
      deliveryFrequencyDays = 1,
      emptyBottlesHeld = 0,
      notes = ''
    } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }
    
    if (!address || !address.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }
    
    if (!mobile || !mobile.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
    }
    
    if (!area || !area.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Area is required'
      });
    }
    
    const existingCustomer = await Customer.findOne({ mobile: mobile.trim() });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number already registered to another customer'
      });
    }
    
    const customer = new Customer({
      name: name.trim(),
      address: address.trim(),
      mobile: mobile.trim(),
      area: area.trim(),
      salesmanId: salesmanId === 'unassigned' || !salesmanId ? null : salesmanId,
      totalBalance: parseFloat(totalBalance) || 0,
      deliveryFrequencyDays: parseInt(deliveryFrequencyDays) || 1,
      emptyBottlesHeld: parseInt(emptyBottlesHeld) || 0,
      notes: notes.trim(),
      isActive: true,
      lastEmptiesCollectionDate: null
    });
    
    await customer.save();
    console.log('✅ Customer created successfully:', customer._id);
    
    // Update area customer count
    await updateAreaCustomerCount(area);
    
    // Update salesman customers count if assigned
    if (customer.salesmanId) {
      await updateSalesmanCustomerCount(customer.salesmanId);
    }
    
    const responseCustomer = {
      id: customer._id,
      _id: customer._id,
      name: customer.name,
      address: customer.address,
      mobile: customer.mobile,
      area: customer.area,
      salesmanId: customer.salesmanId,
      totalBalance: customer.totalBalance,
      totalBottlesPurchased: customer.totalBottlesPurchased,
      deliveryFrequencyDays: customer.deliveryFrequencyDays,
      emptyBottlesHeld: customer.emptyBottlesHeld,
      lastEmptiesCollectionDate: customer.lastEmptiesCollectionDate ? 
        customer.lastEmptiesCollectionDate.toISOString() : null,
      notes: customer.notes || '',
      isActive: customer.isActive,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString()
    };
    
    res.status(201).json({
      success: true,
      message: 'Customer added successfully',
      data: responseCustomer
    });
    
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

router.put('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.id;
    
    const existingCustomer = await Customer.findById(id);
    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    const oldArea = existingCustomer.area;
    const oldSalesmanId = existingCustomer.salesmanId;
    
    if (updates.mobile && updates.mobile !== existingCustomer.mobile) {
      const mobileExists = await Customer.findOne({ 
        mobile: updates.mobile,
        _id: { $ne: id }
      });
      if (mobileExists) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number already registered to another customer'
        });
      }
    }
    
    const customer = await Customer.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();
    
    // Update area customer counts
    if (updates.area && updates.area !== oldArea) {
      await updateAreaCustomerCount(oldArea);
      await updateAreaCustomerCount(updates.area);
    }
    
    // Update salesman customers counts
    if (updates.salesmanId && updates.salesmanId !== oldSalesmanId) {
      if (oldSalesmanId) await updateSalesmanCustomerCount(oldSalesmanId);
      if (updates.salesmanId) await updateSalesmanCustomerCount(updates.salesmanId);
    }
    
    const formattedCustomer = {
      id: customer._id,
      _id: customer._id,
      name: customer.name,
      address: customer.address,
      mobile: customer.mobile,
      area: customer.area,
      salesmanId: customer.salesmanId,
      totalBalance: customer.totalBalance,
      totalBottlesPurchased: customer.totalBottlesPurchased,
      deliveryFrequencyDays: customer.deliveryFrequencyDays,
      emptyBottlesHeld: customer.emptyBottlesHeld,
      lastEmptiesCollectionDate: customer.lastEmptiesCollectionDate ? 
        customer.lastEmptiesCollectionDate.toISOString() : null,
      notes: customer.notes || '',
      isActive: customer.isActive,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString()
    };
    
    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: formattedCustomer
    });
    
  } catch (error) {
    console.error('Error updating customer:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

router.delete('/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    const area = customer.area;
    const salesmanId = customer.salesmanId;
    
    customer.isActive = false;
    await customer.save();
    
    // Update area customer count
    await updateAreaCustomerCount(area);
    
    // Update salesman customers count
    if (salesmanId) {
      await updateSalesmanCustomerCount(salesmanId);
    }
    
    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

router.get('/customers/stats/summary', async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments({ isActive: true });
    
    const totalBalanceResult = await Customer.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$totalBalance' } } }
    ]);
    
    const totalEmptyBottlesResult = await Customer.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$emptyBottlesHeld' } } }
    ]);
    
    const customersByArea = await Customer.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$area', count: { $sum: 1 }, totalBalance: { $sum: '$totalBalance' } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalCustomers,
        totalBalance: totalBalanceResult[0]?.total || 0,
        totalEmptyBottles: totalEmptyBottlesResult[0]?.total || 0,
        customersByArea
      }
    });
    
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

router.get('/customers/areas/list', async (req, res) => {
  try {
    const areas = await Customer.distinct('area', { isActive: true });
    res.json({
      success: true,
      data: areas.sort()
    });
  } catch (error) {
    console.error('Error getting areas:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

router.get('/customers/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    
    const customers = await Customer.find({
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { mobile: { $regex: query, $options: 'i' } }
      ]
    })
    .limit(10)
    .lean();
    
    const formattedCustomers = customers.map(customer => ({
      id: customer._id,
      name: customer.name,
      mobile: customer.mobile,
      area: customer.area,
      totalBalance: customer.totalBalance
    }));
    
    res.json({
      success: true,
      data: formattedCustomers
    });
    
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// ========== SALESMAN ROUTES ========== //
router.get('/salesmen', async (req, res) => {
  try {
    const { active = 'true', search } = req.query;
    
    const query = { isActive: active === 'true' };
    
    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }
    
    const salesmen = await Salesman.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    const formattedSalesmen = salesmen.map(salesman => ({
      id: salesman._id,
      _id: salesman._id,
      name: salesman.name,
      mobile: salesman.mobile,
      address: salesman.address || '',
      hireDate: salesman.hireDate ? salesman.hireDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      monthlySalary: salesman.monthlySalary,
      areasAssigned: salesman.areasAssigned || [],
      customersAssigned: salesman.customersAssigned,
      totalSales: salesman.totalSales,
      totalCommission: salesman.totalCommission,
      notes: salesman.notes || '',
      isActive: salesman.isActive,
      createdAt: salesman.createdAt.toISOString(),
      updatedAt: salesman.updatedAt.toISOString()
    }));
    
    res.json({
      success: true,
      data: formattedSalesmen
    });
    
  } catch (error) {
    console.error('Error fetching salesmen:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

router.get('/salesmen/:id', async (req, res) => {
  try {
    const salesman = await Salesman.findById(req.params.id).lean();
    
    if (!salesman) {
      return res.status(404).json({
        success: false,
        message: 'Salesman not found'
      });
    }
    
    const formattedSalesman = {
      id: salesman._id,
      _id: salesman._id,
      name: salesman.name,
      mobile: salesman.mobile,
      address: salesman.address || '',
      hireDate: salesman.hireDate ? salesman.hireDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      monthlySalary: salesman.monthlySalary,
      areasAssigned: salesman.areasAssigned || [],
      customersAssigned: salesman.customersAssigned,
      totalSales: salesman.totalSales,
      totalCommission: salesman.totalCommission,
      notes: salesman.notes || '',
      isActive: salesman.isActive,
      createdAt: salesman.createdAt.toISOString(),
      updatedAt: salesman.updatedAt.toISOString()
    };
    
    res.json({
      success: true,
      data: formattedSalesman
    });
    
  } catch (error) {
    console.error('Error fetching salesman:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

router.post('/salesmen', async (req, res) => {
  try {
    console.log('📝 Creating new salesman:', req.body);
    
    const {
      name,
      mobile,
      address = '',
      hireDate,
      monthlySalary = 0,
      areasAssigned = [],
      notes = ''
    } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Salesman name is required'
      });
    }
    
    if (!mobile || !mobile.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
    }
    
    const existingSalesman = await Salesman.findOne({ mobile: mobile.trim() });
    if (existingSalesman) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number already registered to another salesman'
      });
    }
    
    const salesman = new Salesman({
      name: name.trim(),
      mobile: mobile.trim(),
      address: address.trim(),
      hireDate: hireDate ? new Date(hireDate) : new Date(),
      monthlySalary: parseFloat(monthlySalary) || 0,
      areasAssigned: Array.isArray(areasAssigned) ? areasAssigned.map(area => area.trim()) : [],
      notes: notes.trim(),
      isActive: true,
      customersAssigned: 0,
      totalSales: 0,
      totalCommission: 0
    });
    
    await salesman.save();
    console.log('✅ Salesman created successfully:', salesman._id);
    
    const responseSalesman = {
      id: salesman._id,
      _id: salesman._id,
      name: salesman.name,
      mobile: salesman.mobile,
      address: salesman.address || '',
      hireDate: salesman.hireDate ? salesman.hireDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      monthlySalary: salesman.monthlySalary,
      areasAssigned: salesman.areasAssigned || [],
      customersAssigned: salesman.customersAssigned,
      totalSales: salesman.totalSales,
      totalCommission: salesman.totalCommission,
      notes: salesman.notes || '',
      isActive: salesman.isActive,
      createdAt: salesman.createdAt.toISOString(),
      updatedAt: salesman.updatedAt.toISOString()
    };
    
    res.status(201).json({
      success: true,
      message: 'Salesman added successfully',
      data: responseSalesman
    });
    
  } catch (error) {
    console.error('❌ Error creating salesman:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

router.put('/salesmen/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.id;
    delete updates.customersAssigned;
    delete updates.totalSales;
    delete updates.totalCommission;
    
    const existingSalesman = await Salesman.findById(id);
    if (!existingSalesman) {
      return res.status(404).json({
        success: false,
        message: 'Salesman not found'
      });
    }
    
    if (updates.mobile && updates.mobile !== existingSalesman.mobile) {
      const mobileExists = await Salesman.findOne({ 
        mobile: updates.mobile,
        _id: { $ne: id }
      });
      if (mobileExists) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number already registered to another salesman'
        });
      }
    }
    
    if (updates.areasAssigned && Array.isArray(updates.areasAssigned)) {
      updates.areasAssigned = updates.areasAssigned.map(area => area.trim());
    }
    
    if (updates.hireDate) {
      updates.hireDate = new Date(updates.hireDate);
    }
    
    const salesman = await Salesman.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();
    
    const formattedSalesman = {
      id: salesman._id,
      _id: salesman._id,
      name: salesman.name,
      mobile: salesman.mobile,
      address: salesman.address || '',
      hireDate: salesman.hireDate ? salesman.hireDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      monthlySalary: salesman.monthlySalary,
      areasAssigned: salesman.areasAssigned || [],
      customersAssigned: salesman.customersAssigned,
      totalSales: salesman.totalSales,
      totalCommission: salesman.totalCommission,
      notes: salesman.notes || '',
      isActive: salesman.isActive,
      createdAt: salesman.createdAt.toISOString(),
      updatedAt: salesman.updatedAt.toISOString()
    };
    
    res.json({
      success: true,
      message: 'Salesman updated successfully',
      data: formattedSalesman
    });
    
  } catch (error) {
    console.error('Error updating salesman:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

router.delete('/salesmen/:id', async (req, res) => {
  try {
    const salesman = await Salesman.findById(req.params.id);
    
    if (!salesman) {
      return res.status(404).json({
        success: false,
        message: 'Salesman not found'
      });
    }
    
    salesman.isActive = false;
    await salesman.save();
    
    res.json({
      success: true,
      message: 'Salesman deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting salesman:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

router.get('/salesmen/stats/summary', async (req, res) => {
  try {
    const totalSalesmen = await Salesman.countDocuments({ isActive: true });
    
    const totalSalaryResult = await Salesman.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$monthlySalary' } } }
    ]);
    
    const totalCustomersAssignedResult = await Salesman.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$customersAssigned' } } }
    ]);
    
    const topSalesmen = await Salesman.find({ isActive: true })
      .sort({ customersAssigned: -1 })
      .limit(5)
      .lean();
    
    res.json({
      success: true,
      data: {
        totalSalesmen,
        totalMonthlySalary: totalSalaryResult[0]?.total || 0,
        totalCustomersAssigned: totalCustomersAssignedResult[0]?.total || 0,
        topSalesmen: topSalesmen.map(s => ({
          id: s._id,
          name: s.name,
          customersAssigned: s.customersAssigned,
          totalSales: s.totalSales
        }))
      }
    });
    
  } catch (error) {
    console.error('Error getting salesman stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// ========== AREA ASSIGNMENT ROUTES ========== //

// Helper function to update area customer count
async function updateAreaCustomerCount(areaName) {
  try {
    const area = await AreaAssignment.findOne({ area: areaName, isActive: true });
    if (area) {
      const customerCount = await Customer.countDocuments({ area: areaName, isActive: true });
      area.customerCount = customerCount;
      await area.save();
    }
  } catch (error) {
    console.error('Error updating area customer count:', error);
  }
}

// Helper function to update salesman customer count
async function updateSalesmanCustomerCount(salesmanId) {
  try {
    const customerCount = await Customer.countDocuments({ 
      salesmanId: salesmanId?.toString(), 
      isActive: true 
    });
    await Salesman.findByIdAndUpdate(salesmanId, { customersAssigned: customerCount });
  } catch (error) {
    console.error('Error updating salesman customer count:', error);
  }
}

// Get all area assignments
router.get('/area-assignments', async (req, res) => {
  try {
    console.log('📥 Fetching area assignments...');
    const { active = 'true', salesmanId, search } = req.query;
    
    const query = { isActive: active === 'true' };
    
    if (salesmanId && salesmanId !== 'all' && salesmanId !== 'unassigned') {
      query.salesmanId = salesmanId;
    } else if (salesmanId === 'unassigned') {
      query.salesmanId = null;
    }
    
    if (search && search.trim() !== '') {
      query.area = { $regex: search, $options: 'i' };
    }
    
    const areaAssignments = await AreaAssignment.find(query)
      .populate('salesmanId', 'name mobile')
      .sort({ area: 1 })
      .lean();
    
    for (let area of areaAssignments) {
      const customerCount = await Customer.countDocuments({ 
        area: area.area, 
        isActive: true 
      });
      area.customerCount = customerCount;
    }
    
    const formattedAreas = areaAssignments.map(area => ({
      id: area._id,
      _id: area._id,
      area: area.area,
      salesmanId: area.salesmanId?._id || null,
      salesman: area.salesmanId || null,
      customerCount: area.customerCount,
      isActive: area.isActive,
      createdAt: area.createdAt,
      updatedAt: area.updatedAt
    }));
    
    console.log(`✅ Found ${formattedAreas.length} area assignments`);
    res.json({
      success: true,
      data: formattedAreas
    });
    
  } catch (error) {
    console.error('❌ Error fetching area assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single area assignment by ID
router.get('/area-assignments/:id', async (req, res) => {
  try {
    const area = await AreaAssignment.findById(req.params.id)
      .populate('salesmanId', 'name mobile')
      .lean();
    
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area not found'
      });
    }
    
    const customerCount = await Customer.countDocuments({ 
      area: area.area, 
      isActive: true 
    });
    
    const formattedArea = {
      id: area._id,
      _id: area._id,
      area: area.area,
      salesmanId: area.salesmanId?._id || null,
      salesman: area.salesmanId || null,
      customerCount,
      isActive: area.isActive,
      createdAt: area.createdAt,
      updatedAt: area.updatedAt
    };
    
    res.json({
      success: true,
      data: formattedArea
    });
    
  } catch (error) {
    console.error('❌ Error fetching area:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// Create new area
router.post('/area-assignments', async (req, res) => {
  try {
    console.log('📝 Creating new area:', req.body);
    
    const { area, salesmanId } = req.body;
    
    if (!area || !area.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Area name is required'
      });
    }
    
    const existingArea = await AreaAssignment.findOne({ 
      area: area.trim(),
      isActive: true
    });
    
    if (existingArea) {
      return res.status(400).json({
        success: false,
        message: 'Area already exists'
      });
    }
    
    if (salesmanId && salesmanId !== 'unassigned' && salesmanId !== 'null' && salesmanId !== null) {
      const salesman = await Salesman.findById(salesmanId);
      if (!salesman) {
        return res.status(400).json({
          success: false,
          message: 'Selected salesman not found'
        });
      }
    }
    
    const areaAssignment = new AreaAssignment({
      area: area.trim(),
      salesmanId: salesmanId && salesmanId !== 'unassigned' && salesmanId !== 'null' && salesmanId !== null 
        ? salesmanId 
        : null,
      customerCount: 0
    });
    
    await areaAssignment.save();
    
    if (areaAssignment.salesmanId) {
      await Salesman.findByIdAndUpdate(
        areaAssignment.salesmanId,
        { $addToSet: { areasAssigned: area.trim() } }
      );
    }
    
    console.log('✅ Area created successfully:', areaAssignment._id);
    
    const customerCount = await Customer.countDocuments({ 
      area: areaAssignment.area, 
      isActive: true 
    });
    
    const responseArea = {
      id: areaAssignment._id,
      _id: areaAssignment._id,
      area: areaAssignment.area,
      salesmanId: areaAssignment.salesmanId,
      customerCount,
      isActive: areaAssignment.isActive,
      createdAt: areaAssignment.createdAt,
      updatedAt: areaAssignment.updatedAt
    };
    
    res.status(201).json({
      success: true,
      message: 'Area added successfully',
      data: responseArea
    });
    
  } catch (error) {
    console.error('❌ Error creating area:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Area already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// Update area assignment
router.put('/area-assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { area, salesmanId } = req.body;
    
    console.log('📝 Updating area:', id, req.body);
    
    const existingArea = await AreaAssignment.findById(id);
    if (!existingArea) {
      return res.status(404).json({
        success: false,
        message: 'Area not found'
      });
    }
    
    if (area && area.trim() !== existingArea.area) {
      const areaExists = await AreaAssignment.findOne({ 
        area: area.trim(),
        _id: { $ne: id },
        isActive: true
      });
      if (areaExists) {
        return res.status(400).json({
          success: false,
          message: 'Area name already exists'
        });
      }
    }
    
    const newSalesmanId = salesmanId && salesmanId !== 'unassigned' && salesmanId !== 'null' && salesmanId !== null
      ? salesmanId
      : null;
      
    if (newSalesmanId) {
      const salesman = await Salesman.findById(newSalesmanId);
      if (!salesman) {
        return res.status(400).json({
          success: false,
          message: 'Selected salesman not found'
        });
      }
    }
    
    const oldSalesmanId = existingArea.salesmanId;
    const oldAreaName = existingArea.area;
    const newAreaName = area ? area.trim() : existingArea.area;
    
    existingArea.area = newAreaName;
    existingArea.salesmanId = newSalesmanId;
    await existingArea.save();
    
    if (oldSalesmanId) {
      await Salesman.findByIdAndUpdate(
        oldSalesmanId,
        { $pull: { areasAssigned: oldAreaName } }
      );
    }
    
    if (newSalesmanId) {
      await Salesman.findByIdAndUpdate(
        newSalesmanId,
        { $addToSet: { areasAssigned: newAreaName } }
      );
    }
    
    await Customer.updateMany(
      { area: oldAreaName, isActive: true },
      { $set: { salesmanId: newSalesmanId ? newSalesmanId.toString() : null } }
    );
    
    if (oldSalesmanId) {
      await updateSalesmanCustomerCount(oldSalesmanId);
    }
    
    if (newSalesmanId) {
      await updateSalesmanCustomerCount(newSalesmanId);
    }
    
    await updateAreaCustomerCount(oldAreaName);
    if (oldAreaName !== newAreaName) {
      await updateAreaCustomerCount(newAreaName);
    }
    
    const updatedArea = await AreaAssignment.findById(id)
      .populate('salesmanId', 'name mobile')
      .lean();
    
    const customerCount = await Customer.countDocuments({ 
      area: updatedArea.area, 
      isActive: true 
    });
    
    const responseArea = {
      id: updatedArea._id,
      _id: updatedArea._id,
      area: updatedArea.area,
      salesmanId: updatedArea.salesmanId?._id || null,
      salesman: updatedArea.salesmanId || null,
      customerCount,
      isActive: updatedArea.isActive,
      createdAt: updatedArea.createdAt,
      updatedAt: updatedArea.updatedAt
    };
    
    console.log('✅ Area updated successfully');
    res.json({
      success: true,
      message: 'Area updated successfully',
      data: responseArea
    });
    
  } catch (error) {
    console.error('❌ Error updating area:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// Delete area (soft delete)
router.delete('/area-assignments/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting area:', req.params.id);
    
    const area = await AreaAssignment.findById(req.params.id);
    
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area not found'
      });
    }
    
    const customerCount = await Customer.countDocuments({ 
      area: area.area, 
      isActive: true 
    });
    
    if (customerCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete area with ${customerCount} customer(s). Please reassign customers first.`,
        customerCount
      });
    }
    
    if (area.salesmanId) {
      await Salesman.findByIdAndUpdate(
        area.salesmanId,
        { $pull: { areasAssigned: area.area } }
      );
    }
    
    area.isActive = false;
    await area.save();
    
    console.log('✅ Area deleted successfully');
    res.json({
      success: true,
      message: 'Area deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting area:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// Get area statistics
router.get('/area-assignments/stats/summary', async (req, res) => {
  try {
    console.log('📊 Fetching area statistics...');
    
    const totalAreas = await AreaAssignment.countDocuments({ isActive: true });
    
    const unassignedAreas = await AreaAssignment.countDocuments({ 
      isActive: true, 
      salesmanId: null 
    });
    
    const assignedAreas = totalAreas - unassignedAreas;
    
    const areasWithCustomers = await AreaAssignment.aggregate([
      { $match: { isActive: true } },
      { $project: { area: 1 } },
      { $lookup: {
          from: 'customers',
          let: { areaName: '$area' },
          pipeline: [
            { $match: { 
              $expr: { $eq: ['$area', '$$areaName'] },
              isActive: true 
            }},
            { $count: 'count' }
          ],
          as: 'customerData'
        }
      },
      { $addFields: {
          customerCount: { $ifNull: [{ $arrayElemAt: ['$customerData.count', 0] }, 0] }
        }
      }
    ]);
    
    const totalCustomersInAreas = areasWithCustomers.reduce((sum, area) => sum + area.customerCount, 0);
    
    const topAreas = [...areasWithCustomers]
      .sort((a, b) => b.customerCount - a.customerCount)
      .slice(0, 5)
      .map(area => ({
        id: area._id,
        area: area.area,
        customerCount: area.customerCount
      }));
    
    console.log('✅ Area statistics fetched successfully');
    res.json({
      success: true,
      data: {
        totalAreas,
        unassignedAreas,
        assignedAreas,
        totalCustomersInAreas,
        topAreas
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting area stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

export default router;
