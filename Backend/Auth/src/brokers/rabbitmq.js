import config from '../config/config.js'
import amqp from 'amqplib'
let connection,channel;


export async function ConnectToRabbitMQ(){
    connection=await amqp.connect(config.RABBITMQ_URI)
    channel=await connection.createChannel()
    console.log('Connected To RabbitMQ')
}

export async function PublishToQueue(queueName,message){

    if(!channel){
        await ConnectToRabbitMQ()
    }
    await channel.assertQueue(queueName,{durable:true})

    channel.sendToQueue(queueName,Buffer.from(JSON.stringify(message)))

}
