const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Salesman = require('../models/Salesman');

// Get all customers with filters
router.get('/', async (req, res) => {
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
        
        // Filter by area
        if (area && area !== 'all' && area !== '') {
            query.area = area;
        }
        
        // Filter by salesman
        if (salesmanId && salesmanId !== 'all' && salesmanId !== '') {
            query.salesmanId = salesmanId;
        }
        
        // Search functionality
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
        
        // Get total count for pagination
        const total = await Customer.countDocuments(query);
        
        // Get customers with pagination
        const customers = await Customer.find(query)
            .populate('salesmanId', 'name mobile')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();
        
        // Format response to match frontend expectations
        const formattedCustomers = customers.map(customer => ({
            id: customer._id,
            _id: customer._id,
            name: customer.name,
            address: customer.address,
            mobile: customer.mobile,
            area: customer.area,
            salesmanId: customer.salesmanId ? customer.salesmanId._id : null,
            salesmanName: customer.salesmanId ? customer.salesmanId.name : null,
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

// Get single customer by ID
router.get('/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id)
            .populate('salesmanId', 'name mobile')
            .lean();
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        
        // Format response
        const formattedCustomer = {
            id: customer._id,
            _id: customer._id,
            name: customer.name,
            address: customer.address,
            mobile: customer.mobile,
            area: customer.area,
            salesmanId: customer.salesmanId ? customer.salesmanId._id : null,
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

// Create new customer
router.post('/', async (req, res) => {
    try {
        console.log('Creating new customer:', req.body);
        
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
        
        // Validation
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
        
        // Check if mobile already exists
        const existingCustomer = await Customer.findOne({ mobile: mobile.trim() });
        if (existingCustomer) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number already registered to another customer'
            });
        }
        
        // Validate salesman if provided
        let salesman = null;
        if (salesmanId && salesmanId !== 'unassigned' && salesmanId !== '') {
            salesman = await Salesman.findById(salesmanId);
            if (!salesman) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid salesman selected'
                });
            }
        }
        
        // Create customer
        const customer = new Customer({
            name: name.trim(),
            address: address.trim(),
            mobile: mobile.trim(),
            area: area.trim(),
            salesmanId: salesman ? salesman._id : null,
            totalBalance: parseFloat(totalBalance) || 0,
            deliveryFrequencyDays: parseInt(deliveryFrequencyDays) || 1,
            emptyBottlesHeld: parseInt(emptyBottlesHeld) || 0,
            notes: notes.trim(),
            isActive: true,
            lastEmptiesCollectionDate: null
        });
        
        await customer.save();
        console.log('Customer created successfully:', customer._id);
        
        // Update salesman's customer count if assigned
        if (salesman) {
            salesman.customersAssigned += 1;
            await salesman.save();
        }
        
        // Populate for response
        const savedCustomer = await Customer.findById(customer._id)
            .populate('salesmanId', 'name mobile')
            .lean();
        
        // Format response
        const responseCustomer = {
            id: savedCustomer._id,
            _id: savedCustomer._id,
            name: savedCustomer.name,
            address: savedCustomer.address,
            mobile: savedCustomer.mobile,
            area: savedCustomer.area,
            salesmanId: savedCustomer.salesmanId ? savedCustomer.salesmanId._id : null,
            salesmanName: savedCustomer.salesmanId ? savedCustomer.salesmanId.name : null,
            totalBalance: savedCustomer.totalBalance,
            totalBottlesPurchased: savedCustomer.totalBottlesPurchased,
            deliveryFrequencyDays: savedCustomer.deliveryFrequencyDays,
            emptyBottlesHeld: savedCustomer.emptyBottlesHeld,
            lastEmptiesCollectionDate: savedCustomer.lastEmptiesCollectionDate ? 
                savedCustomer.lastEmptiesCollectionDate.toISOString() : null,
            notes: savedCustomer.notes || '',
            isActive: savedCustomer.isActive,
            createdAt: savedCustomer.createdAt.toISOString(),
            updatedAt: savedCustomer.updatedAt.toISOString()
        };
        
        res.status(201).json({
            success: true,
            message: 'Customer added successfully',
            data: responseCustomer
        });
        
    } catch (error) {
        console.error('Error creating customer:', error);
        
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

// Update customer
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Remove fields that shouldn't be updated
        delete updates._id;
        delete updates.createdAt;
        delete updates.updatedAt;
        delete updates.id;
        
        // Find existing customer
        const existingCustomer = await Customer.findById(id);
        if (!existingCustomer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        
        // Check if mobile is being changed and if it already exists
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
        
        // Handle salesman assignment changes
        const oldSalesmanId = existingCustomer.salesmanId;
        const newSalesmanId = updates.salesmanId === 'unassigned' || !updates.salesmanId ? 
            null : updates.salesmanId;
        
        // Update customer
        const customer = await Customer.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        ).populate('salesmanId', 'name mobile');
        
        // Update salesman customer counts if changed
        if (oldSalesmanId && oldSalesmanId.toString() !== newSalesmanId?.toString()) {
            const oldSalesman = await Salesman.findById(oldSalesmanId);
            if (oldSalesman && oldSalesman.customersAssigned > 0) {
                oldSalesman.customersAssigned -= 1;
                await oldSalesman.save();
            }
        }
        
        if (newSalesmanId && (!oldSalesmanId || oldSalesmanId.toString() !== newSalesmanId.toString())) {
            const newSalesman = await Salesman.findById(newSalesmanId);
            if (newSalesman) {
                newSalesman.customersAssigned += 1;
                await newSalesman.save();
            }
        }
        
        // Format response
        const formattedCustomer = {
            id: customer._id,
            _id: customer._id,
            name: customer.name,
            address: customer.address,
            mobile: customer.mobile,
            area: customer.area,
            salesmanId: customer.salesmanId ? customer.salesmanId._id : null,
            salesmanName: customer.salesmanId ? customer.salesmanId.name : null,
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

// Delete customer (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        
        // Soft delete by setting isActive to false
        customer.isActive = false;
        await customer.save();
        
        // Update salesman's customer count if assigned
        if (customer.salesmanId) {
            const salesman = await Salesman.findById(customer.salesmanId);
            if (salesman && salesman.customersAssigned > 0) {
                salesman.customersAssigned -= 1;
                await salesman.save();
            }
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

// Get customer statistics
router.get('/stats/summary', async (req, res) => {
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

// Get unique areas list
router.get('/areas/list', async (req, res) => {
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

// Search customers by name or mobile
router.get('/search/:query', async (req, res) => {
    try {
        const query = req.params.query;
        
        const customers = await Customer.find({
            isActive: true,
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { mobile: { $regex: query, $options: 'i' } }
            ]
        })
        .populate('salesmanId', 'name mobile')
        .limit(10)
        .lean();
        
        const formattedCustomers = customers.map(customer => ({
            id: customer._id,
            name: customer.name,
            mobile: customer.mobile,
            area: customer.area,
            salesmanName: customer.salesmanId ? customer.salesmanId.name : 'Unassigned',
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

module.exports = router;