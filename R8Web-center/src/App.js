import React, { Component } from 'react'
import axios from 'axios';
import socketIOClient from 'socket.io-client'
const socket = socketIOClient('http://203.157.177.7:8200');
const temp = [];

class App extends Component {
  constructor() {
    super()
    this.state = {
      input: '',
      message: [],
      name: 'userServ',
      backdata: '',
      ss: 'visible',
      getdata: [],
      getMess: '',
      user: ''
    } 
     
  }

  connected =  (message) => {
    const { socketURL, name, input, backdata } = this.state
    socket.emit('username', name)
    this.setState({ss:'hidden'})
  }

  componentDidMount = () => {
    this.response()
  }

  // ส่งข้อมูลไปยัง server 2
  send = () => {
    const { name, input, backdata } = this.state
    socket.emit(`queryRequest`, { receiver:{ hospcode:[],hosptype:[]}, name:name, data:input })
    this.setState({ input: '' })
  }

  // รอรับข้อมูลเมื่อ server มีการ update
  response = () => {
    const { message } = this.state
    const temp = message

    socket.on(`receiveServerMessage`, (messageNew) => {
      console.log(messageNew);
      temp.push(messageNew.data)

      this.setState({ message: temp });
    })

  }


  changeInput = (e) => {
    this.setState({ input: e.target.value })
  }

  // สั่งให้ server 1 ส่งรายชื่อไฟล์ไป server 2 
  updateRequest = () => {
    console.log("Admin force all server to update check");
    socket.emit(`updateRequest`, { receiver:{hospcode:[],hosptype:[]}, name:'', data:{} });
  }


  render() {
    const { ss, name, input, message } = this.state
    const style = { marginTop: 20, paddingLeft: 50 }
    return (
      <div>
        
        <div style={style}>{this.state.user}</div>

        <div style={style}>message :<input value={input} onChange={this.changeInput} />
          <button onClick={() => this.send()}>ส่ง</button>
        </div>

          <button onClick={() => this.updateRequest()}>อัพเดต</button>

        {
          message.map((data, i) =>
            <div key={i} style={style} >
              {i + 1} : {data}
            </div>
          )
        }
      </div>
    )
  }
}

export default App