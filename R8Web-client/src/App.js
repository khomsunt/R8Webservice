import React, { Component } from 'react'
import axios from 'axios';
import socketIOClient from 'socket.io-client'
const socket = socketIOClient('http://localhost:8200');
const temp = [];

class App extends Component {
  constructor() {
    super()
    this.state = {
      input: '',
      message: [],
      name: 'CCC',
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

  addData(newData){
    axios.request({
      method:'post',
      url:'http://localhost:3000/api/iotests',
      data: newData
    }).then(response => {
      this.props.history.push('/');
    }).catch(err => console.log(err));
  }

  getData(){
    axios.get(`http://localhost:3000/api/iotests/${this.state.getMess}`)
      .then(response => {
        this.setState({getdata: response.data}, () => {
          console.log(this.state.getdata);
        })
    })
    .catch(err => console.log(err));
  }

  componentDidMount = () => {
    this.response()
  }

  // ส่งข้อมูลไปยัง server 1 
  send = () => {
    const { name, input, backdata } = this.state
    socket.emit(`dataRequest`, { receiver:{hospcode:[],hosptype:[]}, name:name, data:input })
    this.setState({ input: '' })
  }

  // สั่งให้ server 1 ส่งรายชื่อไฟล์ไป server 2 
  updateCheck = () => {
    const { name, input, backdata } = this.state
    socket.emit(`sendUpdateCheck`, { receiver:{hospcode:[],hosptype:[]}, name:name, data:input })
  }

  // รอรับข้อมูลเมื่อ server มีการ update
  response = () => {
    const { message } = this.state
    const temp = message

    socket.on(`dataResponse_${this.state.name}`, (messageNew) => {
console.log(``);
      console.log(messageNew);
      console.log(messageNew.data);
      temp.push(messageNew.data)

      this.setState({ message: temp });
    })

    socket.on('userSet', (userNew) => {
      this.setState({user: userNew.username})
    })
  }


  changeInput = (e) => {
    this.setState({ input: e.target.value })
  }

  // changeInputName = (e) => {
  //   this.setState({ name: e.target.value })
  // }

  render() {
    const { ss, name, input, message } = this.state
    const style = { marginTop: 20, paddingLeft: 50 }
    return (
      <div>
        
        <div style={style}>{this.state.user}</div>

        <div style={style}>message :<input value={input} onChange={this.changeInput} />
          <button onClick={() => this.send()}>ส่ง</button>
        </div>
        <br />
          <button onClick={() => this.updateCheck()}>อัพเดต</button>

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