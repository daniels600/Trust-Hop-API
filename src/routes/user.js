
const express = require('express');

const user = express.Router();

const userModel = require('../models/userModel');


// * GETTING ALL USERS
user.get("/getAll", async(req, res) => {
	 const result = await userModel.findAll();
         
		 res.json(result);
  
});

// * Sign In user Endpoint
user.post("/signIn", async(req, res) => {
	const result = await userModel.signIn(req.body);

	res.json(result);

});

// * Sign Up user Endpoint
user.post("/signUp", async(req, res) => {
	const result = await userModel.signUp(req.body);

	res.json(result);

});

// * GETTING A USER BY ID
user.get('/:id', async (req,res)=>{
	const result = await userModel.findById(req.params.id)
	res.json(result)
});

// * Create a recommendation
user.post('/recommend', async (req,res)=>{
	const result = await userModel.createRecommendation(req.body)
	res.json(result)
});

// * Get all recommendations of user
user.get('/getRecommends/:id', async (req,res)=>{
	const result = await userModel.getAllInRecommendationsById(req.params.id)
	res.json(result)
});


// * UPDATING A USER DATA
user.put('/updateUser/:id', async (req,res)=>{
	const result = await userModel.findByIdAndUpdate(req.params.id, req.body)
	res.json(result)
})


// * DELETING A USER DATA
user.delete('/deleteUser/:id', async (req,res)=>{
	const result = await userModel.findByIdAndDelete(req.params.id)
	res.json(result)
})






//export the router
module.exports = user;