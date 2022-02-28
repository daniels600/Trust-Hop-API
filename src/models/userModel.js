require('dotenv/config');

const {nanoid} = require('nanoid')
const neo4j = require('neo4j-driver')


const {DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_URL, DATABASE_NAME} = process.env;

const driver = neo4j.driver(DATABASE_URL, neo4j.auth.basic(DATABASE_USERNAME, DATABASE_PASSWORD))

const session = driver.session({database: DATABASE_NAME});

// *  Find all users
const findAll = async () => {
    try {
        const result = await session.run(`MATCH (n:User) RETURN n`);

        return result.records.map(i => i.get('n').properties)
    } catch (e) {
        console.log(e);
        return 'No records found';
    }


}

// * Sign Up user
const signUp = async (user) => {
    const id = nanoid(5);
    console.log(id);
    try {
        await session.run(`CREATE (n:User {id: '${id}', name : '${user.name}', password : '${user.password}', email: '${user.email}', phone: '${user.phone}', picture: '${user.picture}'}) RETURN n`);

        return await findById(id);
    } catch (e) {
        console.log('New user cannot be created', e);
        return 'User not created';
    }

}

// * Sign IN user
const signIn = async (user) => {

    var msg;
    try {
        const result = await session.run(`MATCH (n:User) WHERE n.email ='${user.email}' AND n.password ='${user.password}' RETURN n`);
        console.log(result);
        const data = result.records[0].get('n').properties;
        console.log(data.id);
        // console.log('Unique Id: ', id);
        if (result.records.length !== 0) {
            msg = {message: 'success', data: data};
            return msg
        } else {
            msg = JSON.stringify({message: 'failed'});
            return msg
        }

    } catch (e) {
        console.log('Sign in failed', e);
        msg = JSON.stringify({message: e});
        return msg;
    }

}

// *  Find a user by ID can be used for search of a user
const findById = async (id) => {
    try {
        const result = await session.run(`MATCH (n:User) WHERE n.id = '${id}' RETURN n LIMIT 1`);

        return result.records[0].get('n').properties;
    } catch (e) {
        console.log('Id does not exist');
        return 'User not found';
    }

}

// *  get all recommendations of a user
const getAllInRecommendationsById = async (id) => {

    var msg;
    try {
        const result = await session.run(`MATCH (n)<-[r]-(m) WHERE n.id = '${id}' RETURN COLLECT({recommender: m, relation: r}) AS recomms_details`);


        const data = result.records[0].get('recomms_details');

        // for (let value of data.values()){
        //     console.log(value.recommender.properties.name);
        // }

        if(data.length != 0){
            msg = {message: 'success', data: data};
        }else {
            msg = {message: 'No recommendations found', data: data};
        }




        return msg;
    } catch (e) {
        console.log(e)
        return 'No recommendations found';
    }
}


// *  Create a Recommendation
const createRecommendation = async (data) => {

    var msg;
    var countRel;

    // *  Creating the timestamp or time of recommendation
    var ts = new Date().toISOString()
        .replace(/T/, ' ')     // replace T with a space
        .replace(/\..+/, '');

    console.log(ts);

    try {


        // // * check if there already exist a relationship
        // countRel = await session.run(`MATCH (n {id: '${data.trustee_id}'})<-[r]-(p {id: '${data.recommender_id}'}) RETURN COUNT(r) as rel_count`)
        //
        // console.log("Rel count ", countRel.records[0].get('rel_count'));
        //
        // // * create a relationship between the recommender and the recommended
        // if (countRel.records[0].get('rel_count') == 0) {
        //     await session.run(`MATCH (a: User), (b: User) WHERE a.id='${data.recommender_id}' AND b.id='${data.trustee_id}' CREATE (a)-[r:KNOWS]->(b) RETURN a,b`);
        //
        //     await session.run(`MATCH (a: User), (b: User) WHERE a.id='${data.recommender_id}' AND b.id='${data.trustee_id}' CREATE (a)-[r:${data.quality.toUpperCase()} {quality_rate: '${data.quality_rate}', period_rel: '${data.period_rel}', ts: '${ts}'}]->(b) RETURN a,b`);
        // } else {
        //     await session.run(`MATCH (a: User), (b: User) WHERE a.id='${data.recommender_id}' AND b.id='${data.trustee_id}' CREATE (a)-[r:${data.quality.toUpperCase()} {quality_rate: '${data.quality_rate}', period_rel: '${data.period_rel}', ts: '${ts}'}]->(b) RETURN a,b`);
        // }

        await session.run(`MATCH (a: User), (b: User) WHERE a.id='${data.recommender_id}' AND b.id='${data.trustee_id}' CREATE (a)-[r:${data.quality.toUpperCase()} {quality_rate: '${data.quality_rate}', period_rel: '${data.period_rel}', ts: '${ts}'}]->(b) RETURN a,b`);

        msg = {message: 'success'};

        const results = "Recommendation created successfully";

        return msg;
    } catch (e) {
        console.log('New recommendations cannot be created', e);
        return `recommendations not created, '${e}'`;
    }

}


const create = async (user) => {
    const id = nanoid(10);
    console.log(id);
    try {
        await session.run(`CREATE (n:User {id: '${id}', name : '${user.name}', password : '${user.password}'}) RETURN n`);

        return await findAll();
    } catch (e) {
        console.log('New user cannot be created');
        return 'User not created';
    }

}

const findByIdAndUpdate = async (id, newUser) => {
    try {
        const result = await session.run(`MATCH (n:User) WHERE id(n) = ${id} SET n.name = '${newUser.name}' , n.password ='${newUser.password}' RETURN n`);

        return result.records[0].get('n').properties;
    } catch (e) {
        console.log('Update failed: ' + e.message);
        return 'User update failed';
    }


}


const findByIdAndDelete = async (id, newUser) => {
    try {
        await session.run(`MATCH (n:User) WHERE id(n) = ${id} DELETE n`);

        return await findAll();
    } catch (e) {
        console.log('Delete failed: ' + e.message);
        return 'User delete failed';
    }


}


module.exports = {
    findAll,
    findById,
    create,
    findByIdAndUpdate,
    findByIdAndDelete,
    signIn,
    signUp,
    createRecommendation,
    getAllInRecommendationsById
}