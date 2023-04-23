const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const mongoose = require('mongoose');

isLoggedIn = (req, res, next) => {
    if (res.locals.loggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
};

router.get('/transaction', isLoggedIn, async (req, res, next) => {
        let transactions = [];
        if (req.query.sortBy == 'date') {
            transactions = await Transaction.find({ userId: req.user._id }).sort({ date: 1 });
        } else if (req.query.sortBy == 'amount') {
            transactions = await Transaction.find({ userId: req.user._id }).sort({ amount: 1 });
        } else if (req.query.sortBy == 'category') {
            transactions = await Transaction.find({ userId: req.user._id }).sort({ category: 1 });
        } else if (req.query.sortBy == 'description') {
            transactions = await Transaction.find({ userId: req.user._id }).sort({ description: 1 });
        } else {
            transactions = await Transaction.find({ userId: req.user._id });
        }
        console.log(transactions);
        res.render('transaction', { transactions, user: req.user });
    });

router.post('/transaction', isLoggedIn, async (req, res, next) => {
        const transaction = new Transaction({
            description: req.body.description,
            amount: req.body.amount,
            category: req.body.category,
            date: req.body.date,
            userId: req.user._id
        });
        await transaction.save();
        res.redirect('/transaction');
    });

router.get('/transaction/remove/:transactionId', isLoggedIn, async (req, res, next) => {
        console.log("inside /todo/remove/:transactionId")
        await Transaction.deleteOne({ _id: req.params.transactionId });
        res.redirect('/transaction');
    });

router.get('/transaction/edit/:transactionId', isLoggedIn, async (req, res, next) => {
        console.log("inside /transaction/edit/:transactionId")
        const transaction =
            await Transaction.findById(req.params.transactionId);
        res.render('editTransaction', { transaction });
    });

const getTransactionParams = (body) => {
    return {
        description: body.description,
        amount: body.amount,
        category: body.category,
        date: body.date,
    };
};

router.post('/transaction/edit/:transactionId', isLoggedIn, async (req, res, next) => {
        const transactionParams = getTransactionParams(req.body);
        await Transaction.findOneAndUpdate(
            { _id: req.params.transactionId },
            { $set: transactionParams });
        res.redirect('/transaction')
    });

router.get('/transaction/byCategory', isLoggedIn, async (req, res, next) => {
        let transactions =
            await Transaction.aggregate(
                [{
                    $match: {
                        userId: new mongoose.Types.ObjectId(req.user._id)
                    }
                },
                {
                    $group: {
                        _id: '$category',
                        amount: { $sum: '$amount' }
                    }
                },
                { $sort: { amount: -1 } },
                ])
        res.render('groupByCategory', { transactions, user: req.user });
    });

module.exports = router;
