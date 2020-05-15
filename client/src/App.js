import React, {Component, useState} from 'react'
import { ProvideAuth } from "./use-auth.js" 
import './App.css'
import { Switch, BrowserRouter as Router, Route } from "react-router-dom";
import Header from "./header";

import * as firebase from "firebase";
import firebaseConfig from "./firebase.config";

firebase.initializeApp(firebaseConfig);




class App extends Component {

    constructor(props) {
        super(props)
        this.imageInput = React.createRef()
        this.textInput = React.createRef()
        this.encodeImageBtn = React.createRef()
        this.decodeImageBtn = React.createRef()
        this.lengthCheckbox = React.createRef()
        this.state = {
            isLoggedIn : false,
            setLoggedIn : false
        }
    }

    state = {
        decodedText: "",
        beforeImageUrl: "",
        afterImageUrl: "",
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

    render() {
        // let {beforeImageUrl, afterImageUrl} = this.state

        return (
            <ProvideAuth>
            <Router>
            <Header/>

            <div className="App">
                <form encType="multiplart/form-data">
                    <label>Text: <input type="text" ref={this.textInput} name="text"/></label>
                    <input type="file" ref={this.imageInput} name="image" onChange={this.handleFileChanged}/>
                    <input type="button" ref={this.encodeImageBtn} value="Encode" onClick={this.handleEncode}/>
                    <input type="button" ref={this.decodeImageBtn} value="Decode" onClick={this.handleDecode}/>
                    <label>Length: <input type="checkbox" ref={this.lengthCheckbox}/></label>
                </form>

                <img className="preview-img" src={this.state.beforeImageUrl} alt=""/>
                <img className="preview-img" src={this.state.afterImageUrl} alt=""/>
                <div id="decoded-text">{this.state.decodedText}</div>
            </div>
            </Router>
            </ProvideAuth>
        )
    }
}

export default App
