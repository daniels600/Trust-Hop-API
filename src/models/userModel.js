require("dotenv/config");

const { nanoid } = require("nanoid");
const neo4j = require("neo4j-driver");
const fs = require('fs')
const parse = require('csv-parser')


const { DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_URL, DATABASE_NAME } =
process.env;

const driver = neo4j.driver(
    DATABASE_URL,
    neo4j.auth.basic(DATABASE_USERNAME, DATABASE_PASSWORD)
);

const session = driver.session({ database: DATABASE_NAME });


const modelEval_Multi_Strategy = async(trustor_id, trustee_id, trust_value) => {
    try {

        trustor_id = parseInt(trustor_id);
        trustee_id = parseInt(trustee_id);
        trust_value = parseInt(trust_value) == 0 ? parseFloat(trust_value) : parseInt(trust_value);

        const delRel = await session.run(`MATCH (:User {user_id:  ${trustor_id}})-[r:TRUST]->(:User {user_id: ${trustee_id}}) 
        DELETE r`);

        const nameGraph = await session.run(`CALL gds.graph.create('advogatoGraph', 'User',
            'TRUST',
            {
                relationshipProperties: 'trust_rating'
            }
        )`);

        let multi_prop_value = await multiplicativeStrategy(trustor_id, trustee_id);


        const dropGraphName = await session.run(`CALL gds.graph.drop('advogatoGraph') YIELD graphName;`)


        const reconnectRel = await session.run(`MATCH
        (a:User), (b:User)  WHERE a.user_id = ${trustor_id} AND b.user_id = ${trustee_id}
        CREATE (a)-[r:TRUST {trust_rating: ${trust_value} }]->(b)
        RETURN r`)

        return { 'direct_trust': trust_value, 'prop_trust': multi_prop_value };

    } catch (error) {
        console.error(error)

    }

};


const modelEval_Trust_Propagation = async(trustor_id, trustee_id, trust_value) => {
    try {
        trustor_id = parseInt(trustor_id);
        trustee_id = parseInt(trustee_id);
        trust_value = parseInt(trust_value) == 0 ? parseFloat(trust_value) : parseInt(trust_value);
        // let original_trust = parseInt(trust_value) == 0 ? parseFloat(trust_value) : parseInt(trust_value);

        // if (trust_value.toFixed(2) == 0.1) {
        //     trust_value = 10;
        // } else if (trust_value.toFixed(2) == 0.15) {
        //     trust_value = 6.6;
        // } else {
        //     trust_value = 3.3;
        // }


        const delRel = await session.run(`MATCH (:User {user_id:  ${trustor_id}})-[r:TRUST]->(:User {user_id: ${trustee_id}}) 
        DELETE r`);

        const nameGraph = await session.run(`CALL gds.graph.create('advogatoGraph', 'User',
            'TRUST',
            {
                relationshipProperties: 'trust_rating'
            }
        )`);

        let trust_prop_value = await propagativeTrust(trustor_id, trustee_id);

        const dropGraphName = await session.run(`CALL gds.graph.drop('advogatoGraph') YIELD graphName;`)


        const reconnectRel = await session.run(`MATCH
        (a:User), (b:User)  WHERE a.user_id = ${trustor_id} AND b.user_id = ${trustee_id}
        CREATE (a)-[r:TRUST {trust_rating: ${trust_value} }]->(b)
        RETURN r`)

        return { 'direct_trust': trust_value, 'prop_trust': trust_prop_value };

    } catch (error) {
        console.error(error)
    }

}

const modelEval_1 = async() => {

    const filename = "./src/models/advogato_multi_edges.csv"
    const data = []
    fs.createReadStream(filename)
        .pipe(parse({ delimiter: ',' }))
        .on('data', (r) => {
            data.push(r);
        })
        .on('end', async() => {
            // console.log(data);

            let outputData = []

            for (let i = 0; i < 350; i++) {
                // get random index value
                const randomIndex = Math.floor(Math.random() * data.length);

                // get random item
                const item = data[randomIndex];

                const result = await modelEval_Multi_Strategy(item.From, item.To, item.trust_value)

                console.log("Result : ", result)

                outputData.push(result)

            }

            writeToCSVFile(outputData)

        })
}

const modelEval_2 = async() => {

    const filename = "./src/models/advogato_trustP_edges.csv"
    const data = []
    fs.createReadStream(filename)
        .pipe(parse({ delimiter: ',' }))
        .on('data', (r) => {
            data.push(r);
        })
        .on('end', async() => {
            // console.log(data);

            let outputData = []

            for (let i = 0; i < 350; i++) {
                // get random index value
                const randomIndex = Math.floor(Math.random() * data.length);

                // get random item
                const item = data[randomIndex];

                const result = await modelEval_Trust_Propagation(item.From, item.To, item.trust_value)

                console.log("Result : ", result, parseFloat(item.trust_value))

                outputData.push(result)

            }

            writeToCSVFile(outputData)

        })
}

function writeToCSVFile(users) {
    const filename = 'output_trustP.csv';
    fs.writeFile(filename, extractAsCSV(users), err => {
        if (err) {
            console.log('Error writing to csv file', err);
        } else {
            console.log(`saved as ${filename}`);
        }
    });
}

function extractAsCSV(users) {
    const header = ["direct_trust, propagated_trust"];
    const rows = users.map(user =>
        `${user.direct_trust}, ${user.prop_trust}`
    );
    return header.concat(rows).join("\n");
}



// *  Find all users
const findAll = async() => {
    try {
        const result = await session.run(`MATCH (n:User) RETURN n`);

        return result.records.map((i) => i.get("n").properties);
    } catch (e) {
        console.log(e);
        return "No records found";
    }
};

// * Sign Up user
const signUp = async(user) => {
    const id = nanoid(5);
    try {
        await session.run(
            `CREATE (n:User {user_id: '${id}', name : '${user.name}', password : '${user.password}', email: '${user.email}', phone: '${user.phone}', picture: '${user.picture}'}) RETURN n`
        );

        return await findById(id);
    } catch (e) {
        console.log("New user cannot be created", e);
        return "User not created";
    }
};

// * Sign In user
const signIn = async(user) => {
    var msg;
    try {
        const result = await session.run(
            `MATCH (n:User) WHERE n.email ='${user.email}' AND n.password ='${user.password}' RETURN n`
        );

        const data = result.records[0].get("n").properties;

        if (result.records.length !== 0) {
            msg = { message: "success", data: data };
            return msg;
        } else {
            msg = JSON.stringify({ message: "failed" });
            return msg;
        }
    } catch (e) {
        msg = JSON.stringify({ message: e });
        return msg;
    }
};

// *  Find a user by ID can be used for search of a user
const findById = async(id) => {
    try {
        const result = await session.run(
            `MATCH (n:User) WHERE n.user_id = '${id}' RETURN n LIMIT 1`
        );

        return result.records[0].get("n").properties;
    } catch (e) {
        return "User not found";
    }
};

// *  get all recommendations of a user
const getAllInRecommendationsById = async(id) => {
    var msg;
    try {
        const result = await session.run(
            `MATCH (n)<-[r]-(m) WHERE n.user_id = '${id}' RETURN COLLECT({recommender: m, relation: r}) AS recomms_details`
        );

        const data = result.records[0].get("recomms_details");

        if (data.length != 0) {
            msg = { message: "success", data: data };
        } else {
            msg = { message: "No recommendations found", data: data };
        }

        return msg;
    } catch (e) {
        console.log(e);
        return "No recommendations found";
    }
};

// *  Create a Recommendation
const createRecommendation = async(data) => {
    var msg;
    var ts = new Date()
        .toISOString()
        .replace(/T/, " ") // replace T with a space
        .replace(/\..+/, "");

    try {
        await session.run(
            `MATCH (a: User), (b: User) WHERE a.user_id='${
        data.recommender_id
      }' AND b.user_id='${
        data.trustee_id
      }' CREATE (a)-[r:${data.quality.toUpperCase()} {quality_rate: '${
        data.quality_rate
      }', period_rel: '${data.period_rel}', ts: '${ts}'}]->(b) RETURN a,b`
        );

        msg = { message: "success" };

        return msg;
    } catch (e) {
        console.log("New recommendations cannot be created", e);
        return `recommendations not created, '${e}'`;
    }
};

const create = async(user) => {
    const id = nanoid(10);
    console.log(id);
    try {
        await session.run(
            `CREATE (n:User {user_id: '${id}', name : '${user.name}', password : '${user.password}'}) RETURN n`
        );

        return await findAll();
    } catch (e) {
        console.log("New user cannot be created");
        return "User not created";
    }
};

const findByIdAndUpdate = async(id, newUser) => {
    try {
        const result = await session.run(
            `MATCH (n:User) WHERE user_id(n) = ${id} SET n.name = '${newUser.name}' , n.password ='${newUser.password}' RETURN n`
        );

        return result.records[0].get("n").properties;
    } catch (e) {
        console.log("Update failed: " + e.message);
        return "User update failed";
    }
};

const findByIdAndDelete = async(id, newUser) => {
    try {
        await session.run(`MATCH (n:User) WHERE user_id(n) = ${id} DELETE n`);

        return await findAll();
    } catch (e) {
        console.log("Delete failed: " + e.message);
        return "User delete failed";
    }
};

const multiplicativeStrategy = async(trustor_id, trustee_id) => {
    try {
        let trust_value = 1;
        const query = await session.run(`
        MATCH (source:User {user_id: ${trustor_id}}), (target:User {user_id: ${trustee_id}})
        CALL gds.shortestPath.dijkstra.stream('advogatoGraph', {
            sourceNode: source,
            targetNode: target,
            relationshipWeightProperty: 'trust_rating'
        })
        YIELD index, sourceNode, targetNode, totalCost, nodeIds, costs, path
        RETURN
            index,
            gds.util.asNode(sourceNode).user_id AS sourceNodeId,
            gds.util.asNode(targetNode).user_id AS targetNodeId,
            totalCost,
            [nodeId IN nodeIds | gds.util.asNode(nodeId).user_id] AS nodeNames,
            costs,
            nodes(path) as path
        ORDER BY index`);

        const costs = query.records[0].get("costs");

        console.log("Here", costs)

        trust_value = costs[1];

        for (let i = 1; i < costs.length; i++) {
            if (costs[i + 1] != undefined) {
                let node_rating = costs[i];
                let neighbor_rating = costs[i + 1];
                let trust_rating = neighbor_rating - node_rating;
                trust_value = trust_value * trust_rating;
            }
        }
        return trust_value;
    } catch (e) {
        console.log("Error message: " + e.message);
    }
};


const findRel = async(data) => {
    try {
        const query = await session.run(`MATCH ({user_id : ${data.trustor_id}})-[r]->({user_id: ${data.trustee_id}})
        RETURN r`)



        const costs = query.records[0];
        console.log(costs)

        return costs;

    } catch (error) {
        console.log("Error message: " + error.message);

    }
}

const sigmaDistance = (data) => {
    let distance = 0;
    for (let i = 1; i < data; i++) {
        distance += i;
    }
    return distance;
};

const sigmaTrust = (data, distance) => {
    let check = 1;
    let numerator = 0;

    for (let i = 0; i < data.length; i++) {
        let trust_value = data[i].properties["cost"];
        // if (data[i].properties["cost"].toFixed(2) == 0.1) {
        //     trust_value = 10;
        // } else if (data[i].properties["cost"].toFixed(2) == 0.15) {
        //     trust_value = 6.6;
        // } else {
        //     trust_value = 3.3;
        // }

        if (check <= distance) {
            numerator += trust_value * check;
            check++;
        }
    }

    return numerator;
};

const propagativeTrust = async(trustor_id, trustee_id) => {
    try {
        let trust_rating = 1;

        const query = await session.run(`
        MATCH (source:User {user_id: ${trustor_id}}), (target:User {user_id: ${trustee_id}})
        CALL gds.shortestPath.dijkstra.stream('advogatoGraph', {
            sourceNode: source,
            targetNode: target,
            relationshipWeightProperty: 'trust_rating'
        })
        YIELD index, sourceNode, targetNode, totalCost, nodeIds, costs, path
        RETURN
            index,
            gds.util.asNode(sourceNode).user_id AS sourceNodeId,
            gds.util.asNode(targetNode).user_id AS targetNodeId,
            totalCost,
            [nodeId IN nodeIds | gds.util.asNode(nodeId).user_id] AS nodeNames,
            costs,
            nodes(path) as path,
            relationships(path) as weighted_edges
        ORDER BY index`);

        const path = query.records[0].get("weighted_edges");

        // console.log(path)

        trust_rating = sigmaTrust(path, path.length) / sigmaDistance(path.length);

        return trust_rating;
    } catch (e) {
        console.log("Error message: " + e.message);
    }
};

const getAllShortestPaths = async(data) => {
    const query = await session.run(
        `MATCH (p1:User { user_id: ${data.trustor_id}}),(p2:User {user_id: ${data.trustee_id} }), path = allShortestPaths((p1)-[r*]->(p2)) RETURN path, [n in nodes(path) | n.user_id] as paths, r, length(path) as lengths, count(distinct r) AS nRels`
    );

    const paths = query.records[0].get("nRels");

    console.log(paths.low);

    return paths;
};



module.exports = {
    findAll,
    findById,
    create,
    findByIdAndUpdate,
    findByIdAndDelete,
    signIn,
    signUp,
    createRecommendation,
    getAllInRecommendationsById,
    modelEval_1,
    modelEval_2
};