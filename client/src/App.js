import React, {Component} from 'react'
import firebase, {auth, provider} from './firebase.js'
import './App.css'

class App extends Component {
    constructor(props) {
        super(props)
        this.imageInput = React.createRef()
        this.textInput = React.createRef()
        this.encodeImageBtn = React.createRef()
        this.decodeImageBtn = React.createRef()
        this.lengthCheckbox = React.createRef()
        this.login = this.login.bind(this); 
        this.logout = this.logout.bind(this);
        // this.handleChange = this.handleChange.bind(this);
    }

    state = {
        decodedText: "",
        beforeImageUrl: "",
        afterImageUrl: "",
        user: null
    }


    componentDidMount() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.setState({user});
            }
        });
    }

    handleApiRequest = async (method, endpoint, formData) => {
        const response = await fetch(endpoint, {
            method: method,
            body: formData
        })
        if (response.headers.get('Content-Type').startsWith('application/json;'))
            return await response.json()

        return await response.blob()
    }

    handleFileChanged = async (event) => {
        const file = this.imageInput.current.files[0]

        if (file.size > 32 * 1024 * 1024) {
            alert('Please upload a file under 32 MiB')
            event.target.value = null
        } else {
            let reader = new FileReader()
            reader.onload = (event) => {
                this.setState({beforeImageUrl: event.target.result})
            }

            reader.readAsDataURL(file)
        }
    }

    handleEncode = async (event) => {
        event.preventDefault()

        const file = this.imageInput.current.files[0]

        const data = new FormData()
        data.append('image', file)
        data.append('text', this.textInput.current.value)
        data.append('includeLength', this.lengthCheckbox.current.checked)

        const imageResponse = await this.handleApiRequest('post', '/api/encrypt-image', data)

        this.setState({afterImageUrl: window.URL.createObjectURL(imageResponse)})
    }

    handleDecode = async (event) => {
        event.preventDefault()

        const file = this.imageInput.current.files[0]

        const data = new FormData()
        data.append("image", file)
        data.append("hasLength", this.lengthCheckbox.current.checked)

        const decodedText = await this.handleApiRequest("post", "/api/decrypt-image", data)
        this.setState({decodedText: decodedText["text"]})
    }

    logout = async (event) => {
        auth.signOut()
            .then(() => {
                this.setState({
                    user: null
                });
            });
    }

    login = async (event) => {
        auth.signInWithPopup(provider)
            .then((result) => {
                const user = result.user;
                this.setState({
                    user
                });
            });
    }

    render() {
        // let {beforeImageUrl, afterImageUrl} = this.state

        return (

            <div className="App">
                <div className="wrapper">
                    <div className="header">
                    {
                        this.state.user 
                        ?
                        <input className="Log" type="button" ref={this.logoutButton} value="Logout" onClick={this.logout}/>
                        :
                        <React.Fragment>
                        <h1>Login</h1>
                        <input className="Log" type="button" ref={this.loginButton} value="Login" onClick={this.login}/>
                        </React.Fragment>
                    }
                </div>
                {
                    this.state.user
                    ?
                    <div className="container">
                        <h3>Welcome {this.state.user.email}</h3>
                        <form encType="multipart/form-data">
                        
                            <label>Text: <input type="text" ref={this.textInput} name="text"/></label>
                            <input type="file" ref={this.imageInput} name="image" onChange={this.handleFileChanged}/>
                            <input type="button" ref={this.encodeImageBtn} value="Encode" onClick={this.handleEncode}/>
                            <input type="button" ref={this.decodeImageBtn} value="Decode" onClick={this.handleDecode}/>
                            <label>Length: <input type="checkbox" ref={this.lengthCheckbox}/></label>
                          

                        </form>
                    </div>
                    :
                    <h6></h6>
                }
               

                <img className="preview-img" src={this.state.beforeImageUrl} alt=""/>
                <img className="postview-img" src={this.state.afterImageUrl} alt=""/>
                <div id="decoded-text">{this.state.decodedText}</div>
                </div>
            </div>
        )
    }
}

export default App
