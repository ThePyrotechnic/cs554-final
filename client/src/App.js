import React, {Component} from 'react'
import {auth, provider}   from './firebase.js'
import './App.css'
import "../node_modules/picnic/picnic.min.css";

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
        if (response.info && response.info === "An error occurred") return
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
                </div>
                <div className="titleItem vertical-align">
                    <h1>Steganography-Er</h1>
                </div>
                <div className="uploadsTitleItem">
                    <h2>Uploads</h2>
                    <div className="scroller">
                        {this.state.userImages.map((url, index) => (
                            <div className="img-center">
                                <img className="thumbnail" src={url} key={index} alt=""/>
                            </div>

                        ))}
                    </div>
                </div>

                <div>
                    {
                        this.state.user
                            ?
                            <React.Fragment>
                                <div className="userInfoItem">
                                    <h3>Welcome {this.state.user.email}</h3>
                                </div>
                                <div className="logoutItem">
                                    <button class="warning" ref={this.logoutButton} value="Logout"
                                           onClick={this.logout}>Logout</button>
                                </div>
                                <div className="logoutItem">
                                    <label for="modal_1" class="button">How to use</label>
                                    <div class="modal">
                                      <input id="modal_1" type="checkbox" />
                                      <label for="modal_1" class="overlay"></label>
                                      <article>
                                        <header>
                                          <h3>How to use</h3>
                                          <label for="modal_1" class="close">&times;</label>
                                        </header>
                                        <section class="content">
                                          In order to use this application, first upload an image that you want to 
                                          store information in. Next, add some text to store and hit Encode! This 
                                          will display an image with the stored textm which is also stored in the DB 
                                          for ease of access in the future. Now, all you have to do is reupload that 
                                          image and hit decode and your hidden text will be displayed.
                                          Now send secret images to your friends!


                                        </section>
                                        <footer>
                                        </footer>
                                      </article>
                                    </div>
                                </div>
                            </React.Fragment>
                            :
                            <React.Fragment>
                                <h1>Login</h1>
                                <div className="logoutItem">
                                    <button class="warning" ref={this.loginButton} value="Login"
                                           onClick={this.login}>Login</button>
                                </div>
                            </React.Fragment>
                    }
                </div>
                {
                    this.state.user
                        ?
                        <div className="formBoxItem">
                            <div className="form">
                                <form encType="multipart/form-data">
                                    <div>
                                        <label><input type="text" placeholder="Enter text to encode" required="required"
                                                      pattern="[A-Za-z0-9]{1,20}" ref={this.textInput}
                                                      name="text"/></label>
                                    </div>
                                    <div>
                                        <label class="dropimgage">
                                        <input title="drop image or click me" type="file" ref={this.imageInput} name="image"
                                               onChange={this.handleFileChanged}/>
                                        </label>
                                    </div>
                                    <div>
                                        <button width="flex" class="success" ref={this.encodeImageBtn}
                                               value="Encode" onClick={this.handleEncode}>Encode</button>
                                          <div></div>
                                        <button class="failure" ref={this.decodeImageBtn}
                                               value="Decode" onClick={this.handleDecode}>Decode</button>
                                    </div>
                                </form>
                            </div>
                            <div className="encodedImageTitleItem">
                                <h3>Encoded Image:</h3>
                            </div>

                            <div className="encodedImageItem">
                                <div className="img">
                                    <img className="thumbnail" src={this.state.afterImageUrl} alt=""/>
                                </div>
                            </div>
                            <div className="decodedTextTitleItem">
                                <h3>Decoded Text:</h3>
                            </div>
                            <div className="decodedTextItem">
                                <div className="img">
                                    <div id="decoded-text">{this.state.decodedText}</div>
                                </div>

                            </div>
                        </div>
                        :
                        <div></div>
                }

            </div>
        )
    }
}

export default App
