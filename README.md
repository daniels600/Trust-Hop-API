# TrustHop Network API

## Overview

Welcome to the TrustHop Network API! This project is designed to provide a robust backend service that leverages the power of graph databases to manage and query trust levels between individuals in a social network. The backend service is built using Neo4j as the graph database and Node.js with Express to create API endpoints.

## Features

- **Graph Database**: Utilizes Neo4j to store and manage the social network data as a graph.
- **Node.js and Express**: Provides a scalable and efficient backend to handle API requests.
- **Trust Level Calculation**: Implements an algorithm to calculate trust levels between individuals based on their connections within the network.
- **Dynamic Queries**: Allows real-time querying of trust levels with efficient traversal of the graph.

## How It Works

1. **Data Ingestion**: The API accepts a dataset where individuals provide recommendations about their trust levels toward others. This data is structured to reflect a social network.
2. **Graph Construction**: The dataset is processed to create nodes (representing individuals) and edges (representing trust recommendations) in a Neo4j graph database.
3. **Trust Level Calculation**: When a query is made to determine the trust level between two individuals, the algorithm traverses the graph to compute the trust level based on the relationships and recommendations.
4. **API Endpoints**: Provides a set of endpoints to interact with the social network, allowing users to add data, query trust levels, and manage the network.

## Getting Started

### Prerequisites

- **Node.js**: Ensure you have Node.js installed. You can download it from [Node.js Official Website](https://nodejs.org/).
- **Neo4j**: Install and set up Neo4j. You can download it from [Neo4j Download Center](https://neo4j.com/download-center/).

### Installation

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/daniels600/Trust-Hop-API.git
    cd Trust-Hop-API
    ```

2. **Install Dependencies**:
    ```bash
    npm install
    ```

3. **Set Up Neo4j**:
    - Start your Neo4j server.
    - Update the connection settings in the `config` file of the project to match your Neo4j setup (e.g., username, password, and database URL).

### Running the Service

Start the Node.js server:
```bash
npm start
```

The API will be running at `http://localhost:3000`.

## API Endpoints

### Add Data

- **Endpoint**: `/api/mole_trust`
- **Method**: `POST`
- **Description**: Adds a new trust relationship to the network.
- **Request Body**:
    ```json
    {
        "from": "PersonA",
        "to": "PersonB",
        "trustLevel": 5
    }
    ```

### Query Trust Level

- **Endpoint**: `/api/trust`
- **Method**: `GET`
- **Description**: Queries the trust level between two individuals.
- **Request Parameters**:
    - `from`: The individual making the query.
    - `to`: The individual whose trust level is being queried.
- **Example**:
    ```http
    GET /api/trust?from=PersonA&to=PersonB
    ```

### Example Request

To query the trust level from PersonA to PersonB:
```http
GET /api/trust?from=PersonA&to=PersonB
```

## Architecture

### Technologies Used

- **Neo4j**: A highly scalable native graph database.
- **Node.js**: A JavaScript runtime built on Chrome's V8 JavaScript engine.
- **Express**: A minimal and flexible Node.js web application framework.

### Data Model

- **Nodes**: Represent individuals in the network.
- **Edges**: Represent trust relationships between individuals.
- **Properties**: Each edge contains a `trustLevel` property indicating the level of trust.

### Trust Calculation Algorithm

The algorithm traverses the graph from the querying individual to the target individual, aggregating trust levels through direct and indirect connections to provide a comprehensive trust score.

## Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get involved.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any questions or feedback, please contact us at support@trustnetworkapi.com.

---

Thank you for using the Trust Network API! We hope it meets your needs for managing and querying trust levels in social networks.
