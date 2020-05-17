import React, {Component} from 'react'
import {auth, provider}   from './firebase.js'
import './App.css'

class App extends Component {
    constructor(props) {
        super(props)
        this.imageInput = React.createRef()
        this.textInput = React.createRef()
        this.encodeImageBtn = React.createRef()
        this.decodeImageBtn = React.createRef()
        this.login = this.login.bind(this)
        this.logout = this.logout.bind(this)
    }

    state = {
        decodedText: '',
        beforeImageUrl: '',
        afterImageUrl: '',
        user: null,
        userImages: []
    }

    componentDidMount() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.setState({user})
            }

            await this.getUserImages()
        })
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
        data.append('includeLength', 'true')
        data.append('uid', this.state.user ? this.state.user.uid : '')

        const imageResponse = await this.handleApiRequest('post', '/api/encrypt-image', data)

        this.setState({afterImageUrl: window.URL.createObjectURL(imageResponse)})
    }

    handleDecode = async (event) => {
        event.preventDefault()

        const file = this.imageInput.current.files[0]

        const data = new FormData()
        data.append('image', file)
        data.append('hasLength', 'true')

        const decodedText = await this.handleApiRequest('post', '/api/decrypt-image', data)
        this.setState({decodedText: decodedText['text']})
    }

    getUserImages = async () => {
        if (this.state.user === null) return

        const data = new FormData()
        data.append('uid', this.state.user.uid)

        const response = await this.handleApiRequest('post', '/api/user-image-ids', data)
        for (let imageId of response) {
            const imageResponse = await this.getImageById(imageId)
            const imageUrl = window.URL.createObjectURL(imageResponse)
            this.setState({userImages: [...this.state.userImages, imageUrl]})
        }
    }

    getImageById = async (imageId) => {
        const data = new FormData()
        data.append('uid', this.state.user ? this.state.user.uid : '')
        data.append('imageId', imageId)

        return await this.handleApiRequest('post', '/api/image', data)
    }

    logout = async (event) => {
        auth.signOut()
            .then(() => {
                this.setState({
                    user: null
                })
            })
    }

    login = async (event) => {
        auth.signInWithPopup(provider)
            .then((result) => {
                const user = result.user
                this.setState({
                    user: user
                })
            })
    }

    render() {
        // let {beforeImageUrl, afterImageUrl} = this.state
        return (
            <div className="grid-container">
                <div className="emptyItem">
                    me empty
                </div>
                <div className="titleItem">
                    Stenographer
                </div>
                <div className="uploadsItem">
                    uploads
                </div>


                <div className="logoutItem">
                    {
                        this.state.user
                            ?
                            <input className="Log" type="button" ref={this.logoutButton} value="Logout"
                                   onClick={this.logout}/>
                            :
                            <React.Fragment>
                                <h1>Login</h1>
                                <input className="Log" type="button" ref={this.loginButton} value="Login"
                                       onClick={this.login}/>
                            </React.Fragment>
                    }
                </div>
                {
                    this.state.user
                        ?
                        <div className="formBoxItem">
                            <div className="userInfoItem">
                                <h3>Welcome {this.state.user.email}</h3>
                            </div>

                            <form encType="multipart/form-data">
                                <div className="inputTextItem">
                                    <label>Text: <input type="text" ref={this.textInput} name="text"/></label>
                                </div>
                                <div className="fileBrowseItem">
                                    <input type="file" ref={this.imageInput} name="image"
                                           onChange={this.handleFileChanged}/>
                                </div>
                                <div className="encodeItem">
                                    <input type="button" ref={this.encodeImageBtn} value="Encode"
                                           onClick={this.handleEncode}/>
                                </div>
                                <div className="decodeItem">
                                    <input type="button" ref={this.decodeImageBtn} value="Decode"
                                           onClick={this.handleDecode}/>
                                </div>
                            </form>
                        </div>
                        :
                        <div></div>
                }
                <div className="encodedImageItem">
                    <img className="postview-img" src={this.state.afterImageUrl} alt=""/>
                </div>
                <div className="decodedTextItem">
                    <div id="decoded-text">{this.state.decodedText}</div>
                </div>
                <img className="preview-img" src={this.state.beforeImageUrl} alt=""/>
            </div>

        )
    }
}

export default App
