import React, {useEffect, useState} from "react";
import {
    Button,
    Card,
    Checkbox,
    Col,
    Container,
    DatePicker,
    Icon,
    Row,
    Select,
    Textarea,
    TextInput
} from "react-materialize";
import axios from "axios";
import {axiosClient} from "../api/httpClient";
import {connect} from "react-redux";
import {
    errorToast,
    infoToast,
    isCustomer,
    modifiedOrNull,
    parseSqlDateTime,
    successToast,
    toISODate,
    uploadMedia
} from "../api/Util";
import * as _ from "lodash";
import * as actions from "../actions";
import {randomNumber} from "react-ratings-declarative/build/utils";
import Profile from './img/profile.png';

const INITIAL_STATE = {
    firstName: "",
    lastName: "",
    email: "",
    secondaryEmail: "",
    dropboxEmail: "",
    password: "",
    referral: "Other",
    otherReferral: "",
    videoType: "",
    aboutVideo: "",
    socialMediaLink: "",
    videoStyle: "",
    videoInspired: "",
    videoInfo: "",
    additionalVideoInfo: "",
    billingDate: new Date(0),
    preferredEditingSoftware: "",
    userProfile: {},
};

export default connect(mapStateToProps, actions)((props) => {

    const loggedInUser = props?.auth?.loggedInUser || {};
    const customer = isCustomer(loggedInUser);
    const incompleteProfile = loggedInUser.is_temporary_password || !loggedInUser.is_profile_completed;
    const [state, setState] = useState(INITIAL_STATE);
    const [updateDisabled, setUpdateDisabled] = useState(false);
    const [profileImage, setProfileImage] = useState(null);

    const refreshUser = () => {
        infoToast("Loading");
        const cancelToken = axios.CancelToken.source();
        axiosClient.get('/api/user/' + loggedInUser.client_id, {cancelToken: cancelToken.token})
            .then(({data}) => {
                setState(prev => ({
                    ...prev,
                    firstName: data.firstname,
                    lastName: data.lastname,
                    email: data.useremail,
                    secondaryEmail: data.secondary_email || prev.secondaryEmail,
                    dropboxEmail: data.dropbox_email || prev.dropboxEmail,
                    referral: data.referral || prev.referral,
                    otherReferral: data.otherreferral || prev.otherReferral,
                    videoType: data.video_type || prev.videoType,
                    aboutVideo: data.about_video || prev.aboutVideo,
                    socialMediaLink: data.social_media_link || prev.socialMediaLink,
                    videoStyle: data.video_style || prev.videoStyle,
                    videoInspired: data.video_inspired || prev.videoInspired,
                    videoInfo: data.video_info || prev.videoInfo,
                    additionalVideoInfo: data.additional_video_info || prev.additionalVideoInfo,
                    billingDate: parseSqlDateTime(data.billing_date),
                    preferredEditingSoftware: data.preferred_editing_software || "",
                    userProfile: data
                }));
                setProfileImage(data.profile_img);
                setState(prev => ({...prev, preferredEditingSoftware: data.preferred_editing_software || ""}));
            }).catch(err => {
                if (!axios.isCancel(err)) {
                    errorToast("Something went wrong");
                    console.error(err);
                }
            });

        return cancelToken;
    };

    useEffect(() => {
        const cancelToken = refreshUser();

        return () => cancelToken.cancel("Page closed");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loggedInUser, customer, incompleteProfile]);

    function onClickUpdate() {
        setUpdateDisabled(true);
        let data = {
            firstname: modifiedOrNull(state.firstName, state.userProfile.firstname),
            lastname: modifiedOrNull(state.lastName, state.userProfile.lastname),
            email: modifiedOrNull(state.email, state.userProfile.useremail),
            secondary_email: modifiedOrNull(state.secondaryEmail, state.userProfile.secondary_email),
            dropbox_email: modifiedOrNull(state.dropboxEmail, state.userProfile.dropbox_email),
            password: (state.password != null && state.password !== "") ? state.password : null,
            referral: modifiedOrNull(state.referral, state.userProfile.referral),
            otherreferral: modifiedOrNull(state.otherReferral, state.userProfile.otherreferral) || state.userProfile.otherreferral,
            video_type: modifiedOrNull(state.videoType, state.userProfile.video_type),
            about_video: modifiedOrNull(state.aboutVideo, state.userProfile.about_video),
            social_media_link: modifiedOrNull(state.socialMediaLink, state.userProfile.social_media_link),
            video_style: modifiedOrNull(state.videoStyle, state.userProfile.video_style),
            video_inspired: modifiedOrNull(state.videoInspired, state.userProfile.video_inspired),
            video_info: modifiedOrNull(state.videoInfo, state.userProfile.video_info),
            additional_video_info: modifiedOrNull(state.additionalVideoInfo, state.userProfile.additional_video_info),
            billing_date: modifiedOrNull(toISODate(state.billingDate), state.userProfile.billing_date),
            preferred_editing_software: modifiedOrNull(state.preferredEditingSoftware, state.userProfile.preferred_editing_software),
        };

        data = _.pickBy(data, _.identity);

        axiosClient.post('/api/user/profile', data).then(({data}) => {
            successToast(data.message || "Profile updated successfully");

            if(incompleteProfile) {
                props.fetchUser();
                setTimeout(props.history.push("/"), 1000);
            }
        }).catch(err => {
            errorToast("Unable to update profile");
            console.error(err);
        }).finally(() => {
            setUpdateDisabled(false);
        });
    }

    function onChange(e) {
        let name = e.target.name;
        let value = e.target.value;
        setState(prev => ({...prev, [name]: value}));
    }

    function validated() {
        return !(incompleteProfile && state.password === "");
    }

    async function updateProfileImage() {
        if (profileImage === state.userProfile.profile_img) {
            return;
        }
        try {
            let url = null;
            const progressBar = infoToast("Updating avatar, please wait", 0);
            if (profileImage) {
                url = await fetch(profileImage)
                    .then(r => r.blob())
                    .then(blob => uploadMedia(blob, loggedInUser.client_id, progressBar));

            }
            await axiosClient.post('/api/user/profile', {profile_img: url || ''});
            successToast("Avatar updated successfully");
            props.fetchUser();
        } catch(err) {
            console.error(err);
            errorToast("Something went wrong in uploading");
        }
    }

    return (
        <Card
            title={incompleteProfile ? "Complete your registration" :  "Your Profile"}
            actions={[
                <Button key="refresh-btn" onClick={refreshUser} node="button" waves="green" large flat>
                    Reload <Icon right>refresh</Icon>
                </Button>,
                <Button key="update-btn" onClick={() => onClickUpdate()} disabled={updateDisabled || !validated()}
                        node="button" waves="green" className="btn-primary" large>
                    Update <Icon right>save</Icon>
                </Button>
            ]}
        >
            <Container>
                <Row>
                    <Col s={12} m={6}>
                        <label htmlFor="file-input">
                            <img src={profileImage || Profile} alt="Avatar" style={{width: "300px", height: "auto", cursor: "pointer"}}/>
                        </label>
                        <input id="file-input" type="file" style={{display: "none"}} accept="image/*" onChange={e => setProfileImage(URL.createObjectURL(e.target.files[0]))}/>
                        <br/>
                        <Button onClick={() => setProfileImage(null)} icon={<Icon left>clear</Icon>} style={{width: "150px"}} className="btn-danger"
                                tooltip="Press Set Avatar afterwards to save changes">Clear</Button>
                        <Button onClick={updateProfileImage} icon={<Icon left>save</Icon>} style={{width: "150px"}} className="btn-primary"
                                tooltip="Save image as avatar">Set Avatar</Button>
                    </Col>
                </Row>
                {
                    loggedInUser.is_temporary_password ?
                    <Row>
                        <Icon left>warning</Icon><h5 className="text-darken-1">Please set a new password</h5>
                    </Row>
                        : null
                }
                <Row>
                    <TextInput s={12} m={6}
                               id={randomNumber()}
                               password
                               name="password"
                               label={"New Password" + (incompleteProfile ? " *" : "")}
                               value={state.password}
                               onChange={onChange}
                    />
                    {
                        customer ?
                            <DatePicker s={12} m={6}
                                        disabled={true}
                                        options={{
                                            format: "yyyy-mm-dd",
                                            defaultDate: state.billingDate,
                                            setDefaultDate: true
                                        }}
                            /> : null
                    }
                    <TextInput s={12} m={6}
                               id={randomNumber()}
                               name="firstName"
                               label="First Name *"
                               value={state.firstName}
                               onChange={onChange}
                    />
                    <TextInput s={12} m={6}
                               id={randomNumber()}
                               name="lastName"
                               label="Last Name *"
                               value={state.lastName}
                               onChange={onChange}
                    />
                    {
                        customer ?
                            <Select s={12} m={6}
                                    id={randomNumber()}
                                    name="referral"
                                    label="How did you find us? *"
                                    value={state.referral}
                                    onChange={onChange} >
                                <option value="Google">Google</option>
                                <option value="Linkedin">Linkedin</option>
                                <option value="Google Search">Google Search</option>
                                <option value="Facebook">Facebook</option>
                                <option value="Affiliate">Affiliate</option>
                                <option value="Other">Other</option>
                            </Select> : null
                    }
                    {
                        customer && (state.referral === "Other" || state.referral === "Affiliate") ?
                            <TextInput s={12} m={6}
                                       id={randomNumber()}
                                       name="otherReferral"
                                       label="How did you find us? *"
                                       value={state.otherReferral}
                                       onChange={onChange}
                            /> : null
                    }
                    <TextInput s={12} m={6}
                               id={randomNumber()}
                               email validate
                               name="email"
                               label="Your account login email (primary)? *"
                               value={state.email}
                               onChange={onChange}
                    />
                    <TextInput s={12} m={6}
                               id={randomNumber()}
                               email validate
                               name="secondaryEmail"
                               label="Any assistant's email address?"
                               value={state.secondaryEmail}
                               onChange={onChange}
                    />
                    <TextInput s={12} m={6}
                               id={randomNumber()}
                               email validate
                               name="dropboxEmail"
                               label="What is your Dropbox email? *"
                               value={state.dropboxEmail}
                               onChange={onChange}
                    />
                    {
                        customer ? React.Children.toArray([
                            <TextInput s={12} m={6}
                                       id={randomNumber()}
                                       name="videoType"
                                       label="What kind of video do you mostly deal with?"
                                       value={state.videoType}
                                       onChange={onChange}
                            />,
                            <Textarea s={12} m={6}
                                      id={randomNumber()}
                                      name="aboutVideo"
                                      label="Tell me more about your videos?"
                                      value={state.aboutVideo}
                                      onChange={onChange}
                            />,
                            <Textarea s={12} m={6}
                                      id={randomNumber()}
                                      name="socialMediaLink"
                                      label="What is your YouTube channel? What are your active social media accounts?"
                                      value={state.socialMediaLink}
                                      onChange={onChange}
                            />,
                            <Textarea s={12} m={6}
                                      id={randomNumber()}
                                      name="videoStyle"
                                      label="What is the basic format and style of your videos?"
                                      value={state.videoStyle}
                                      onChange={onChange}
                            />,
                            <Textarea s={12} m={6}
                                      id={randomNumber()}
                                      name="videoInspired"
                                      label="Who or what videos inspire you or look do you really like?"
                                      value={state.videoInspired}
                                      onChange={onChange}
                            />,
                            <Textarea s={12} m={6}
                                      id={randomNumber()}
                                      name="videoInfo"
                                      label="What else do you think we should know about your videos, your company, or how they should be edited?"
                                      value={state.videoInfo}
                                      onChange={onChange}
                            />,
                            <Textarea s={12} m={6}
                                      id={randomNumber()}
                                      name="additionalVideoInfo"
                                      label="Any other information would you like to give us?"
                                      value={state.additionalVideoInfo}
                                      onChange={onChange}
                            />,
                            <Select s={12} m={6}
                                    id={randomNumber()}
                                    name="preferredEditingSoftware"
                                    label="Which editing software would you like us to use?"
                                    value={state.preferredEditingSoftware}
                                    onChange={onChange} >
                                <option value="" >Choose an option</option>
                                <option value="NA">Not Applicable</option>
                                <option value="FCPX">Final Cut Pro</option>
                                <option value="Adobe Premier Pro">Adobe Premier Pro</option>
                            </Select>,
                            <Col s={12} m={6} id={randomNumber()}>
                                <Checkbox disabled={true}
                                          name="subtitles"
                                          label="Subtitles plan"
                                          checked={Boolean(state.userProfile.has_subtitles) || false}
                                          value="1"/>
                            </Col>,
                            <Col s={12} m={6} id={randomNumber()}>
                                <Checkbox disabled={true}
                                          name="hasYoutubeHelper"
                                          label="Youtube Helper plan"
                                          checked={Boolean(state.userProfile.has_youtube_helper) || false}
                                          value="1"/>
                            </Col>,
                        ]) : null
                    }
                </Row>
            </Container>
        </Card>
    );
});

function mapStateToProps({auth}) {
    return {auth};
}
