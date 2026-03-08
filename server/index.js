const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

// ========== MIDDLEWARE ========== //
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080','https://nishat-beverages-kfyk.vercel.app','https://nishat-beverages.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== DATABASE CONNECTION ========== //
const MONGODB_URI = process.env.MONGODB_URI;
const USE_LOCAL_FALLBACK = true; // Set to false if you only want Atlas

const connectDB = async (retryCount = 0) => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🔌 DATABASE CONNECTION ATTEMPT');
    console.log('='.repeat(60));
    
    // Connection options to handle DNS and network issues
    const options = {
      serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10,
      minPoolSize: 2,
    };

    console.log(`📂 Attempting to connect to database: nishatplant`);
    console.log(`🌐 Connection type: MongoDB Atlas`);
    console.log(`🔄 Retry attempt: ${retryCount}`);

    await mongoose.connect(MONGODB_URI, options);
    
    console.log('\n✅ MongoDB Atlas Connected Successfully!');
    console.log(`📁 Database Name: ${mongoose.connection.db.databaseName}`);
    console.log(`📊 Host: ${mongoose.connection.host}`);
    console.log(`🔄 Connection State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    // Create indexes for better performance
    await createIndexes();
    
    return true;

  } catch (error) {
    console.error('\n❌ MongoDB Atlas Connection Failed:', error.message);
    
    if (error.name === 'MongooseServerSelectionError') {
      console.error('⚠️  Server Selection Error - This usually means:');
      console.error('   1. Your IP is not whitelisted in MongoDB Atlas');
      console.error('   2. Network/DNS issues');
      console.error('   3. Atlas cluster is not accessible');
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️  Connection refused - DNS resolution failed');
      console.error('   This is often a network/DNS issue');
    }

    // Try fallback to local MongoDB if enabled
    if (USE_LOCAL_FALLBACK && retryCount === 0) {
      console.log('\n🔄 Attempting to connect to local MongoDB as fallback...');
      try {
        const localUri = 'mongodb://localhost:27017/nishatplant';
        await mongoose.connect(localUri, {
          serverSelectionTimeoutMS: 5000,
          family: 4
        });
        
        console.log('\n✅ Local MongoDB Connected Successfully!');
        console.log(`📁 Database Name: ${mongoose.connection.db.databaseName}`);
        console.log(`📍 Host: localhost`);
        
        // Create indexes for better performance
        await createIndexes();
        
        return true;
      } catch (localError) {
        console.error('❌ Local MongoDB connection also failed:', localError.message);
        console.log('\n💡 FINAL TROUBLESHOOTING:');
        console.log('1. Make sure MongoDB is installed locally');
        console.log('2. Run: mongod (in a separate terminal)');
        console.log('3. Check if MongoDB service is running');
        console.log('4. Try connecting with MongoDB Compass first');
        
        if (retryCount < 2) {
          console.log(`\n🔄 Retrying connection in 5 seconds... (Attempt ${retryCount + 2}/3)`);
          setTimeout(() => connectDB(retryCount + 1), 5000);
        } else {
          console.log('\n❌ Failed to connect after 3 attempts. Please fix the issues above.');
          process.exit(1);
        }
      }
    } else {
      if (retryCount < 2) {
        console.log(`\n🔄 Retrying connection in 5 seconds... (Attempt ${retryCount + 2}/3)`);
        setTimeout(() => connectDB(retryCount + 1), 5000);
      } else {
        console.log('\n❌ Failed to connect after 3 attempts. Please check your MongoDB Atlas settings.');
        process.exit(1);
      }
    }
  }
};

// Helper function to create indexes
const createIndexes = async () => {
  try {
    console.log('\n📊 Creating database indexes...');
    
    // User indexes
    await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.collection('users').createIndex({ phone: 1 });
    
    // Customer indexes
    await mongoose.connection.collection('customers').createIndex({ mobile: 1 }, { unique: true });
    await mongoose.connection.collection('customers').createIndex({ area: 1 });
    await mongoose.connection.collection('customers').createIndex({ salesmanId: 1 });
    await mongoose.connection.collection('customers').createIndex({ name: 'text', mobile: 'text' });
    
    // Salesman indexes
    await mongoose.connection.collection('salesmen').createIndex({ mobile: 1 }, { unique: true });
    await mongoose.connection.collection('salesmen').createIndex({ name: 1 });
    
    // Area indexes
    await mongoose.connection.collection('areaassignments').createIndex({ area: 1 }, { unique: true });
    await mongoose.connection.collection('areaassignments').createIndex({ salesmanId: 1 });
    
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.log('⚠️  Index creation warning:', error.message);
    // Don't fail if indexes already exist
  }
};

// ========== SCHEMAS ========== //

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'admin'
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

// Customer Schema
const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    unique: true
  },
  area: {
    type: String,
    required: [true, 'Area is required'],
    trim: true
  },
  salesmanId: {
    type: String,
    default: null
  },
  totalBalance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative']
  },
  totalBottlesPurchased: {
    type: Number,
    default: 0,
    min: [0, 'Bottles purchased cannot be negative']
  },
  deliveryFrequencyDays: {
    type: Number,
    default: 1,
    min: [1, 'Delivery frequency must be at least 1 day']
  },
  emptyBottlesHeld: {
    type: Number,
    default: 0,
    min: [0, 'Empty bottles cannot be negative']
  },
  lastEmptiesCollectionDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Customer = mongoose.model('Customer', customerSchema);

// Salesman Schema
const salesmanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Salesman name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    unique: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  monthlySalary: {
    type: Number,
    default: 0,
    min: [0, 'Salary cannot be negative']
  },
  areasAssigned: [{
    type: String,
    trim: true
  }],
  customersAssigned: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  totalCommission: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

const Salesman = mongoose.model('Salesman', salesmanSchema);

// Area Assignment Schema
const areaAssignmentSchema = new mongoose.Schema({
  area: {
    type: String,
    required: [true, 'Area name is required'],
    unique: true,
    trim: true,
    maxlength: [200, 'Area name cannot exceed 200 characters']
  },
  salesmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salesman',
    default: null
  },
  customerCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const AreaAssignment = mongoose.model('AreaAssignment', areaAssignmentSchema);

// ========== ROOT ROUTE ========== //
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  const dbName = mongoose.connection.db?.databaseName || 'Not connected';
  
  res.json({ 
    message: 'Nishat Beverages Admin API',
    database: {
      status: dbStatus,
      name: dbName,
      host: mongoose.connection.host || 'N/A'
    },
    endpoints: {
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
        users: 'GET /api/auth/users',
        createAdmin: 'POST /api/auth/create-admin'
      },
      customers: {
        getAll: 'GET /api/customers',
        getOne: 'GET /api/customers/:id',
        create: 'POST /api/customers',
        update: 'PUT /api/customers/:id',
        delete: 'DELETE /api/customers/:id',
        stats: 'GET /api/customers/stats/summary',
        areas: 'GET /api/customers/areas/list',
        search: 'GET /api/customers/search/:query'
      },
      salesmen: {
        getAll: 'GET /api/salesmen',
        getOne: 'GET /api/salesmen/:id',
        create: 'POST /api/salesmen',
        update: 'PUT /api/salesmen/:id',
        delete: 'DELETE /api/salesmen/:id',
        stats: 'GET /api/salesmen/stats/summary'
      },
      areas: {
        getAll: 'GET /api/area-assignments',
        getOne: 'GET /api/area-assignments/:id',
        create: 'POST /api/area-assignments',
        update: 'PUT /api/area-assignments/:id',
        delete: 'DELETE /api/area-assignments/:id',
        stats: 'GET /api/area-assignments/stats/summary'
      },
      health: 'GET /api/health'
    }
  });
});

app.get('/api/health', (req, res) => {
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
app.post('/api/auth/signup', async (req, res) => {
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

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password, email, phone } = req.body;
    
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

app.get('/api/auth/users', async (req, res) => {
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

app.post('/api/auth/create-admin', async (req, res) => {
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
app.get('/api/customers', async (req, res) => {
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

app.get('/api/customers/:id', async (req, res) => {
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

app.post('/api/customers', async (req, res) => {
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

app.put('/api/customers/:id', async (req, res) => {
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

app.delete('/api/customers/:id', async (req, res) => {
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

app.get('/api/customers/stats/summary', async (req, res) => {
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

app.get('/api/customers/areas/list', async (req, res) => {
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

app.get('/api/customers/search/:query', async (req, res) => {
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
app.get('/api/salesmen', async (req, res) => {
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

app.get('/api/salesmen/:id', async (req, res) => {
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

app.post('/api/salesmen', async (req, res) => {
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

app.put('/api/salesmen/:id', async (req, res) => {
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

app.delete('/api/salesmen/:id', async (req, res) => {
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

app.get('/api/salesmen/stats/summary', async (req, res) => {
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
app.get('/api/area-assignments', async (req, res) => {
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
app.get('/api/area-assignments/:id', async (req, res) => {
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
app.post('/api/area-assignments', async (req, res) => {
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
app.put('/api/area-assignments/:id', async (req, res) => {
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
app.delete('/api/area-assignments/:id', async (req, res) => {
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
app.get('/api/area-assignments/stats/summary', async (req, res) => {
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

// ========== ERROR HANDLING MIDDLEWARE ========== //
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ========== 404 HANDLER ========== //
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ========== START SERVER ========== //
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 NISHAT BEVERAGES RO PLANT - ADMIN SERVER');
  console.log('='.repeat(60));
  console.log(`📡 Server URL: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(60));
  console.log('\n🔐 AUTHENTICATION ENDPOINTS:');
  console.log(`   POST  http://localhost:${PORT}/api/auth/signup`);
  console.log(`   POST  http://localhost:${PORT}/api/auth/login`);
  console.log(`   POST  http://localhost:${PORT}/api/auth/create-admin (optional)`);
  console.log(`   GET   http://localhost:${PORT}/api/auth/users`);
  console.log('\n👥 CUSTOMER ENDPOINTS:');
  console.log(`   GET   http://localhost:${PORT}/api/customers`);
  console.log(`   POST  http://localhost:${PORT}/api/customers`);
  console.log(`   GET   http://localhost:${PORT}/api/customers/areas/list`);
  console.log('\n👤 SALESMAN ENDPOINTS:');
  console.log(`   GET   http://localhost:${PORT}/api/salesmen`);
  console.log(`   POST  http://localhost:${PORT}/api/salesmen`);
  console.log(`   GET   http://localhost:${PORT}/api/salesmen/stats/summary`);
  console.log('\n📍 AREA ASSIGNMENT ENDPOINTS:');
  console.log(`   GET    http://localhost:${PORT}/api/area-assignments`);
  console.log(`   POST   http://localhost:${PORT}/api/area-assignments`);
  console.log(`   GET    http://localhost:${PORT}/api/area-assignments/:id`);
  console.log(`   PUT    http://localhost:${PORT}/api/area-assignments/:id`);
  console.log(`   DELETE http://localhost:${PORT}/api/area-assignments/:id`);
  console.log(`   GET    http://localhost:${PORT}/api/area-assignments/stats/summary`);
  console.log('='.repeat(60));
  
  // Connect to database
  connectDB().then(() => {
    console.log('\n✅ Server is fully ready!');
    console.log('💡 Tip: Use email or phone number to login');
    console.log('='.repeat(60) + '\n');
  });
});