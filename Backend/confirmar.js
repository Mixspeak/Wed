const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const { nombre, telefono } = JSON.parse(event.body);
  
  const params = {
    TableName: 'ConfirmacionesEvento',
    Item: {
      id: Date.now().toString(),
      nombre,
      telefono,
      fecha: new Date().toISOString()
    }
  };

  try {
    await dynamoDB.put(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Confirmación exitosa' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al guardar' })
    };
  }
};