import React, {useState} from "react";
import {connect} from "react-redux";
import {Link, Redirect} from "react-router-dom";
import {Button, Col, ProgressBar, Row, Select, TextInput} from "react-materialize";
import {axiosClient} from "../api/httpClient";
import {errorToast, successToast} from "../api/Util";
import ReCAPTCHA from "react-google-recaptcha";
import LoginPageCommon from "./LoginPageCommon";

const INITIAL_STATE = {
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    dropbox_email: "",
    secondary_email: "",
    referral: "NA",
    otherreferral: "",
    recaptcha: null
}

export default connect(mapStateToProps)((props) => {

    const [progress, setProgress] = useState(false);
    const [state, setState] = useState(INITIAL_STATE);

    if (props.auth.loggedIn) {
        return (<Redirect to="/"/>);
    }

    function validateForm() {
        return state.firstname && state.lastname && state.email && state.password;
    }

    function handleSubmit() {
        setProgress(true);
        axiosClient.post('/api/signup', state)
            .then(response => {
                successToast(response?.data?.message || "Account created successfully");
                props.history.push("/login");
            }).catch(err => {
                console.error(err);
                errorToast("Something went wrong: " + err.message);
            }).finally(() => {
                setProgress(false);
            });
    }

    function onChange(e) {
        let name = e.target.name;
        let value = e.target.value;

        setState(prevState => ({...prevState, [name]: value}));
    }

    function onCaptcha(value) {
        setState(prevState => ({...prevState, recaptcha: value}));
    }

    return (
        <LoginPageCommon>
            <h5>Let us edit your videos!</h5>
            <div style={{paddingTop: "20px", width: "80%", maxWidth: "400px", margin: "auto"}}>
                <div className="left-align" style={{width: "80%", margin: "auto"}}>
                    <h4>Sign Up</h4>
                    <p>Or, <Link to='/login'>click here to log in to an account</Link></p>
                </div>

                <Row>
                    <TextInput
                        s={12}
                        inputClassName="border-text-box"
                        name="firstname"
                        placeholder="First Name *"
                        autoFocus
                        value={state.firstname}
                        onChange={onChange}
                    />
                    <TextInput
                        s={12}
                        inputClassName="border-text-box"
                        name="lastname"
                        placeholder="Last Name *"
                        value={state.lastname}
                        onChange={onChange}
                    />
                    <TextInput
                        s={12}
                        inputClassName="border-text-box"
                        name="email"
                        placeholder="Email *"
                        email validate
                        value={state.email}
                        onChange={onChange}
                    />
                    <TextInput
                        s={12}
                        inputClassName="border-text-box"
                        name="password"
                        placeholder="Password *"
                        password
                        value={state.password}
                        onChange={onChange}
                    />
                    <Select
                        s={12}
                        className="border-text-box"
                        name="referral"
                        label="How did you find us?"
                        value={state.referral || "NA"}
                        onChange={onChange}>
                        <option value="NA">How did you find us?</option>
                        <option value="Google">Google</option>
                        <option value="Linkedin">Linkedin</option>
                        <option value="Google Search">Google Search</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Affiliate">Affiliate</option>
                        <option value="Other">Other</option>
                    </Select>
                    {
                        (state.referral === 'Other' || state.referral === 'Affiliate') &&
                        <TextInput
                            s={12}
                            inputClassName="border-text-box"
                            name="otherreferral"
                            placeholder="Please mention source"
                            value={state.otherreferral}
                            disabled={state.referral !== 'Other' && state.referral !== 'Affiliate'}
                            onChange={onChange}
                        />
                    }
                    <Col className="center-align" s={12}>
                        <ReCAPTCHA
                            style={{display: "inline-block"}}
                            name="g-recaptcha-response"
                            sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
                            onChange={onCaptcha}
                        />
                    </Col>
                    {
                        props.auth.loading || progress ? <ProgressBar/> : ""
                    }
                </Row>
                <Row className="center-align">
                    <Col s={12} style={{padding: 0}}>
                        <Button className="btn-primary round-button" disabled={!validateForm() || progress}
                                onClick={handleSubmit}>Signup</Button>
                    </Col>
                </Row>
            </div>
        </LoginPageCommon>
    );
});

function mapStateToProps({auth}) {
    return {auth};
}
