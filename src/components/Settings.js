import React, {useState} from "react";
import {connect} from "react-redux";
import {errorToast, isAdmin, successToast} from "../api/Util";
import {Redirect} from "react-router-dom";
import {Button, Card, Checkbox, Col, Container, Icon, Row, Textarea, TextInput} from "react-materialize";
import {axiosClient} from "../api/httpClient";
import * as actions from '../actions';

const SETTINGS = {
    enable_banner: false,
    banner_heading: "",
    banner_heading_style: "",
    banner_text: "",
    banner_text_style: "",
    banner_image: "",
    banner_image_style: ""
}

export default connect(mapStateToProps, actions)((props) => {

    if (!isAdmin(props?.auth?.loggedInUser)) {
        return <Redirect to="/"/>
    }

    let data = props.settings || {};
    const [state, setState] = useState({
        enable_banner: data.enable_banner || SETTINGS.enable_banner,
        banner_heading: data.banner_heading || SETTINGS.banner_heading,
        banner_heading_style: data.banner_heading_style || SETTINGS.banner_heading_style,
        banner_text: data.banner_text || SETTINGS.banner_text,
        banner_text_style: data.banner_text_style || SETTINGS.banner_text_style,
        banner_image: data.banner_image || SETTINGS.banner_image,
        banner_image_style: data.banner_image_style || SETTINGS.banner_image_style
    });

    function saveSettings() {
        let body = {...state, enable_banner: state.enable_banner ? 1 : 0};
        axiosClient.put('/api/portal/settings', body)
            .then(({data}) => {
                successToast(data.message || "Settings saved");
                props.updateSettings(body);
            }).catch(err => {
                errorToast("Something went wrong");
            });
    }

    function onChange(e) {
        let name = e.target.name;
        let value = e.target.value;

        if(e.target.type === 'checkbox') {
            setState(prevState => ({...prevState, [name]: !prevState[name]}));
        } else {
            setState(prevState => ({...prevState, [name]: value}));
        }
    }

    return (
        <Row>
            <Col s={12}>
                <Card title="Admin Portal Settings" actions={[
                    <Button key="save-btn" className="btn-primary" icon={<Icon left>save</Icon>} onClick={saveSettings}>Save</Button>
                ]}>
                    <Container>
                        <Row>
                            <Col s={12}>
                                <Icon left>visibility_off</Icon>
                                <Checkbox name="enable_banner" id="check-enable_banner" value="1"
                                          label="Enable Announcement" onChange={onChange} checked={state.enable_banner}/>
                            </Col>
                            <TextInput s={8} id="txt_bh" name="banner_heading" label="Heading" value={state.banner_heading} onChange={onChange}/>
                            <TextInput s={4} id="txt_bhs" name="banner_heading_style" label="Heading Style" value={state.banner_heading_style} onChange={onChange}/>
                            <Textarea s={8} id="txt_bt" name="banner_text" label="Body" value={state.banner_text} onChange={onChange}/>
                            <TextInput s={4} id="txt_bts"  name="banner_text_style" label="Body Style" value={state.banner_text_style} onChange={onChange}/>
                            <TextInput s={8} id="txt_bi" name="banner_image" label="Image" value={state.banner_image} onChange={onChange}/>
                            <TextInput s={4} id="txt_bis" name="banner_image_style" label="Image Style" value={state.banner_image_style} onChange={onChange}/>
                        </Row>
                    </Container>
                </Card>
            </Col>
        </Row>
    );
});

function mapStateToProps({auth, settings}) {
    return {auth, settings};
}
