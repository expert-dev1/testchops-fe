import React, {useEffect, useState} from "react";
import {connect} from "react-redux";
import {Redirect, useParams} from "react-router-dom";
import {
    Button,
    Card,
    Col,
    Container,
    DatePicker,
    Divider,
    Icon,
    Row,
    Select,
    Textarea,
    TextInput
} from "react-materialize";
import {axiosClient} from "../api/httpClient";
import {
    errorToast,
    finishToast,
    getUserOptions,
    infoToast,
    isAdmin,
    isCustomer,
    isEditor,
    modifiedOrNull,
    parseSqlDateTime,
    successToast,
    toISODate,
    updateToast
} from "../api/Util";
import * as _ from 'lodash';
import ConfirmationDialog from "./ConfirmationDialog";
import {
    ADMIN,
    CUSTOM,
    CUSTOMER,
    DOUBLE,
    QA_USER,
    SINGLE,
    TEAM_LEAD,
    UNLIMITED,
    WEEKLY,
    YT_HELPER,
    YT_HELPER_LEAD
} from "../api/Constants";
import {randomNumber} from "react-ratings-declarative/build/utils";


const INITIAL_STATE = {
    firstName: "",
    lastName: "",
    email: "",
    secondaryEmail: "",
    type: "",
    dropboxEmail: "",
    password: "",
    teamLead: "0",
    assignQa: ["0", "0"],
    userProfile: {},
    billingDate: new Date(0),
    subscriptionType: SINGLE,
    customSubscription: "",
    subtitles: "0",
    hasYoutubeHelper: "0",
    teamNote: "",
    youtubeHelper: "0",
    preferredEditingSoftware: "",
    referral: "Other",
    otherReferral: "",
    videoType: "",
    aboutVideo: "",
    socialMediaLink: "",
    videoStyle: "",
    videoInspired: "",
    videoInfo: "",
    additionalVideoInfo: "",
};

export default connect(mapStateToProps)((props) => {
    const {userId} = useParams();

    if(props?.auth?.loggedInUser?.client_id !== userId && isCustomer(props?.auth?.loggedInUser)) {
        return <Redirect to="/" />
    }
    const cantEdit = !isAdmin(props?.auth?.loggedInUser) && userId !== props?.auth?.loggedInUser?.client_id;
    const [state, setState]
        = useState(INITIAL_STATE);
    const {firstName, lastName, email, password, secondaryEmail, type, teamLead, dropboxEmail, userProfile, assignQa,
        billingDate, subscriptionType, customSubscription, subtitles, hasYoutubeHelper, youtubeHelper, teamNote,
        preferredEditingSoftware} = state;
    const [disableTeamLead, setDisableTeamLead] = useState(false);
    const [updateDisabled, setUpdateDisabled] = useState(false);
    const [confirmation, setConfirmation] = useState(false);

    const refreshUser = () => {
        const toastId = infoToast("Loading user data", 0.0);
        axiosClient.get('/api/user/' + userId, {
            onDownloadProgress: (pE) => updateToast(toastId.current, pE.loaded / (pE.total || 10000))
        }).then(response => {
            let user = response.data;
            finishToast(toastId.current);

            let ytHelper = (user.assignments || [])
                .filter(assignment => assignment.client_type === YT_HELPER || assignment.client_type === YT_HELPER_LEAD)
                .map(assignment => `${assignment.client_id}`)
                .concat(Array(1).fill("0")).slice(0,1)[0];

            setState({
                firstName: user.firstname,
                lastName: user.lastname,
                email: user.useremail,
                secondaryEmail: user.secondary_email || "",
                type: user.client_type,
                dropboxEmail: user.dropbox_email || "",
                password: "",
                teamLead: `${user.assigned_to_lead_id}`,
                userProfile: user,
                assignQa: (user.qas || []).map(qa => `${qa.client_id}`).concat(Array(2).fill("0")).slice(0,2),
                billingDate: parseSqlDateTime(user.billing_date),
                subscriptionType: user.subscription_type,
                customSubscription: user.custom_subscription,
                subtitles: `${user.has_subtitles}`,
                hasYoutubeHelper: `${user.has_youtube_helper}`,
                youtubeHelper: ytHelper,
                teamNote: user.team_notes,
                preferredEditingSoftware: user.preferred_editing_software || "",
                referral: user.referral,
                otherReferral: user.otherreferral,
                videoType: user.video_type,
                aboutVideo: user.about_video,
                socialMediaLink: user.social_media_link,
                videoStyle: user.video_style,
                videoInspired: user.video_inspired,
                videoInfo: user.video_info,
                additionalVideoInfo: user.additional_video_info,
            });
            setState(prev => ({ ...prev, type: user.client_type}));
        }).catch(err => {
            errorToast(`Unable to load user: ${err.message}`);
            console.error(err);
        });
    };

    useEffect(() => {
        setState(INITIAL_STATE);
        setDisableTeamLead(false);
        refreshUser();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    function onUserTypeChange(e) {
        const {value} = e.target;
        setState(prev => ({...prev, teamLead: null, type: value}));
        if(isEditor({client_type: value})) {
            setDisableTeamLead(false)
        } else {
            setDisableTeamLead(true)
        }
    }

    function onClickUpdate() {
        setConfirmation(true);
    }

    async function updateUser() {
        setUpdateDisabled(true);
        let data = {
            firstname: modifiedOrNull(firstName, userProfile.firstname),
            lastname: modifiedOrNull(lastName, userProfile.lastname),
            email: modifiedOrNull(email, userProfile.useremail),
            secondary_email: modifiedOrNull(secondaryEmail, userProfile.secondary_email),
            client_type: modifiedOrNull(type, userProfile.client_type),
            dropbox_email: modifiedOrNull(dropboxEmail, userProfile.dropbox_email),
            password: (password != null && password !== "") ? password : null,
        };
        let extras;
        if(isCustomer(userProfile)) {
            extras = {
                assign_qa: assignQa.filter(qa => qa && qa !== "0").map(Number),
                billing_date: modifiedOrNull(toISODate(billingDate), userProfile.billing_date),
                subscription_type: modifiedOrNull(subscriptionType, userProfile.subscription_type),
                custom_subscription: modifiedOrNull(customSubscription, userProfile.custom_subscription),
                has_subtitles: modifiedOrNull(subtitles, `${userProfile.has_subtitles}`),
                has_youtube_helper: modifiedOrNull(hasYoutubeHelper, `${userProfile.has_youtube_helper}`),
                assign_yt_helper: [youtubeHelper].filter(yt => yt && yt !== "0").map(Number),
                team_note: modifiedOrNull(teamNote, userProfile.team_note),
                preferred_editing_software: modifiedOrNull(preferredEditingSoftware, userProfile.preferred_editing_software),
                referral: modifiedOrNull(state.referral, userProfile.referral),
                otherreferral: modifiedOrNull(state.otherReferral, userProfile.otherreferral),
                video_type: modifiedOrNull(state.videoType, userProfile.video_type),
                about_video:  modifiedOrNull(state.aboutVideo, userProfile.about_video),
                social_media_link:  modifiedOrNull(state.socialMediaLink, userProfile.social_media_link),
                video_style:  modifiedOrNull(state.videoStyle, userProfile.video_style),
                video_inspired:  modifiedOrNull(state.videoInspired, userProfile.video_inspired),
                video_info:  modifiedOrNull(state.videoInfo, userProfile.video_info),
                additional_video_info:  modifiedOrNull(state.additionalVideoInfo, userProfile.additional_video_info),
            };
        } else {
            extras = {
                assigned_to_lead_id: teamLead,
            };
        }
        data = _.assign({}, data, extras);
        data = _.pickBy(data, _.identity);

        axiosClient.put('/api/user/' + userId, data).then(() => {
            successToast(`User ${userProfile.firstname} ${userProfile.lastname} updated`);
        }).catch(err => {
            errorToast("Unable to update user: " + err.message);
        }).finally(() => {
            setUpdateDisabled(false);
            setConfirmation(false);
        });
    }

    function onChange(e) {
        const {name, value} = e.target;
        setState(prev => ({...prev, [name]: value}));
    }

    function onChangeQa(e, index) {
        const value = e.target.value;
        let qas = [...assignQa];
        qas[index] = value;
        setState(prev => ({...prev, assignQa: qas}));
    }

    return (
        <Card actions={[
            <Button key="refresh-btn" onClick={e => refreshUser(e)} node="button" waves="green" large flat>
                Reload <Icon right>refresh</Icon>
            </Button>,
            <Button key="update-btn" onClick={() => onClickUpdate()} disabled={updateDisabled} node="button" waves="green" className="btn-primary" large>
                Update <Icon right>save</Icon>
            </Button>
        ]} style={{padding: '20px'}}>
            <Container>
                <ConfirmationDialog
                    onNegative={() => setConfirmation(false)}
                    onPositive={updateUser}
                    confirmationHeader="Confirmation"
                    confirmationDialogId="userUpdateConfirmation"
                    confirmation={confirmation}
                    confirmationText="Are you sure you want to update this user profile?"
                />
                <Row>
                    <TextInput s={12} m={6} id="txtFirstName" name="firstName" label="First Name" icon="person"
                               value={firstName} onChange={onChange} disabled={cantEdit}/>
                    <TextInput s={12} m={6} id="txtLastName" name="lastName" label="Last Name" icon="person"
                               value={lastName} onChange={onChange} disabled={cantEdit}/>
                </Row>
                <Row>
                    <TextInput s={12} m={6} id="txtEmail" name="email" label="Email" email validate icon="email"
                               value={email} onChange={onChange} disabled={cantEdit}/>
                    <TextInput s={12} m={6} id="txtPassword" name="password" label="Password" icon="lock"
                               value={password} onChange={onChange} disabled={cantEdit}/>
                </Row>
                <Row>
                    <TextInput s={12} m={6} id="txtSecondaryEmail" name="secondaryEmail" label="Assistant Email" email validate icon="email"
                               value={secondaryEmail} onChange={onChange} disabled={cantEdit}/>
                    <TextInput s={12} m={6} id="txtDropboxEmail" name="dropboxEmail" label="What is your Dropbox Email" icon="email"
                               value={dropboxEmail} onChange={onChange} email validate disabled={cantEdit}/>
                </Row>
                {
                    type !== CUSTOMER ?
                    <Row>
                        <Select s={12} m={6} disabled={cantEdit}
                                icon={<Icon>assignment</Icon>}
                                id="clientType"
                                name="clientType"
                                key="select-client-type"
                                label="User Type"
                                value={type}
                                onChange={onUserTypeChange}>
                            <option value="">
                                User Type
                            </option>
                            <option value={YT_HELPER}>
                                Youtube Helper
                            </option>
                            <option value={QA_USER}>
                                QA
                            </option>
                            <option value={TEAM_LEAD}>
                                Team Lead
                            </option>
                            <option value={YT_HELPER_LEAD}>
                                Youtube Helper Team Lead
                            </option>
                            <option value={ADMIN}>
                                Admin
                            </option>
                        </Select>
                        <Select s={12} m={6} name="teamLead"
                                icon={<Icon>supervisor_account</Icon>}
                                id="assignTeamLead"
                                label="Team Lead"
                                value={teamLead}
                                disabled={disableTeamLead || cantEdit}
                                onChange={onChange}>
                            <option value="0">
                                None
                            </option>
                            {getUserOptions(props.users.users, TEAM_LEAD)}
                            {getUserOptions(props.users.users, YT_HELPER_LEAD)}
                        </Select>
                    </Row>
                        :
                    <Row>
                        <Select s={12} m={6} disabled={cantEdit}
                                icon={<Icon>supervisor_account</Icon>}
                                id="assignQa"
                                label="Assign QA"
                                value={assignQa[0]}
                                onChange={e => onChangeQa(e, 0)}>
                            <option value="0">
                                None
                            </option>
                            {getUserOptions(props.users.users, QA_USER)}
                        </Select>
                        <Select s={12} m={6} disabled={cantEdit}
                                icon={<Icon>supervisor_account</Icon>}
                                id="assignQa2"
                                label="Assign QA"
                                value={assignQa[1]}
                                onChange={e => onChangeQa(e, 1)}>
                            <option value="0">
                                None
                            </option>
                            {getUserOptions(props.users.users, QA_USER)}
                        </Select>
                    </Row>
                }
                {
                    type === CUSTOMER ?
                        React.Children.toArray([<Row>
                            <Select s={12} m={6} disabled={cantEdit}
                                    icon={<Icon>assignment</Icon>}
                                    id="subscriptionType"
                                    name="subscriptionType"
                                    label="Subscription Type"
                                    value={subscriptionType}
                                    onChange={onChange}>
                                <option value="">
                                    None
                                </option>
                                <option value={SINGLE}>
                                    {SINGLE}
                                </option>
                                <option value={WEEKLY}>
                                    {WEEKLY}
                                </option>
                                <option value={UNLIMITED}>
                                    {UNLIMITED}
                                </option>
                                <option value={DOUBLE}>
                                    {DOUBLE}
                                </option>
                                <option value={CUSTOM}>
                                    {CUSTOM}
                                </option>
                            </Select>
                            <TextInput
                                s={12} m={6}
                                name="customSubscription"
                                label="Custom Plan"
                                icon="short_text"
                                disabled={subscriptionType !== CUSTOM || cantEdit}
                                value={customSubscription}
                                onChange={onChange}
                            />
                        </Row>,
                        <Row>
                            <Select s={12} m={6} disabled={cantEdit}
                                    icon={<Icon>help</Icon>}
                                    name="subtitles"
                                    label="Subtitles plan"
                                    value={subtitles}
                                    onChange={onChange}>
                                <option value="0">
                                    Disable
                                </option>
                                <option value="1">
                                    Enable
                                </option>
                            </Select>
                            <Col s={12} m={6}>
                                <Button icon={<Icon>date_range</Icon>} style={{marginTop: '25px'}} tooltip="Billing Date"/>
                                <DatePicker disabled={cantEdit}
                                            options={{
                                                autoClose: true,
                                                format: "yyyy-mm-dd",
                                                defaultDate: billingDate,
                                                setDefaultDate: true
                                            }}
                                            onChange={(d) => setState(prev => ({...prev, billingDate: d}))}
                                            style={{width: "25rem"}}/>
                            </Col>
                        </Row>,
                        <Row>
                            <Select s={12} m={6} disabled={cantEdit}
                                    icon={<Icon>help</Icon>}
                                    name="hasYoutubeHelper"
                                    label="Youtube Helper plan"
                                    value={hasYoutubeHelper}
                                    onChange={onChange}>
                                <option value="0">
                                    Disable
                                </option>
                                <option value="1">
                                    Enable
                                </option>
                            </Select>
                            <Select s={12} m={6} name="youtubeHelper"
                                    icon={<Icon>supervisor_account</Icon>}
                                    id="assignYtHelper"
                                    label="Youtube Helper"
                                    value={youtubeHelper || "0"}
                                    disabled={hasYoutubeHelper === "0" || cantEdit}
                                    onChange={onChange}>
                                <option value="0">
                                    None
                                </option>
                                {getUserOptions(props.users.users, YT_HELPER)}
                            </Select>
                        </Row>,
                        <Row>
                            <Select s={12} m={6}
                                    icon={<Icon>movie_creation</Icon>}
                                    id={randomNumber()}
                                    name="preferredEditingSoftware"
                                    label="Which editing software would you like us to use?"
                                    value={state.preferredEditingSoftware}
                                    onChange={onChange} >
                                <option value="NA">Not Applicable</option>
                                <option value="FCPX">Final Cut Pro</option>
                                <option value="Adobe Premier Pro">Adobe Premier Pro</option>
                            </Select>
                        </Row>,
                        <Divider/>,
                        <Row>
                        {
                            !isCustomer(props?.auth?.loggedInUser) &&
                                <div>
                                    <Col s={12}>
                                        <h4>For Team Notes</h4>
                                    </Col>
                                    <Textarea s={12} label="Team Notes" icon={<Icon>short_text</Icon>} name="teamNote" onChange={onChange} value={teamNote}/>
                                </div>
                        }
                        </Row>,
                        <Row>
                            <Select s={12} m={6}
                                    id="selectReferral"
                                    name="referral"
                                    label="How did you find us?"
                                    value={state.referral}
                                    disabled={cantEdit}
                                    onChange={onChange} >
                                <option value="Google">Google</option>
                                <option value="Linkedin">Linkedin</option>
                                <option value="Google Search">Google Search</option>
                                <option value="Facebook">Facebook</option>
                                <option value="Affiliate">Affiliate</option>
                                <option value="Other">Other</option>
                            </Select>
                            {
                                state.referral === "Other" || state.referral === "Affiliate" ?
                                    <TextInput s={12} m={6}
                                               id="otherReferral"
                                               name="otherReferral"
                                               label="How did you find us? *"
                                               value={state.otherReferral}
                                               disabled={cantEdit}
                                               onChange={onChange}
                                    /> : null
                            }
                            <TextInput s={12} m={6} id="txtVideoType" name="videoType"
                                       label="What kind of video do you mostly deal with?"
                                       icon="short_text" value={state.videoType} onChange={onChange} disabled={cantEdit}/>
                        </Row>,
                        <Divider/>,
                        <Row>
                            <TextInput s={12} m={6} id="txtAboutVideo" name="aboutVideo"
                                       label="Tell me more about your videos?"
                                       icon="short_text" value={state.aboutVideo} onChange={onChange} disabled={cantEdit}/>
                            <TextInput s={12} m={6} id="txtSMLink" name="socialMediaLink"
                                       label="What is your YouTube channel? What are your active social media accounts?"
                                       icon="short_text" value={state.socialMediaLink} onChange={onChange} disabled={cantEdit}/>
                        </Row>,
                        <Divider/>,
                        <Row>
                            <TextInput s={12} m={6} id="txtVideoStyle" name="videoStyle"
                                       label="What is the basic format and style of your videos?"
                                       icon="short_text" value={state.videoStyle} onChange={onChange} disabled={cantEdit}/>
                            <TextInput s={12} m={6} id="txtVideoInspired" name="videoInspired"
                                       label="Who or what videos inspire you or look do you really like?"
                                       icon="short_text" value={state.videoInspired} onChange={onChange} disabled={cantEdit}/>
                        </Row>,
                        <Divider />,
                        <Row>
                            <TextInput s={12} m={6} id="txtVideoInfo" name="videoInfo"
                                       label="What else do you think we should know about your videos, your company, or how they should be edited?"
                                       icon="short_text" value={state.videoInfo} onChange={onChange} disabled={cantEdit}/>
                            <TextInput s={12} m={6} id="txtAdditionalVideoInfo" name="additionalVideoInfo"
                                       label="Any other information would you like to give us?" icon="short_text"
                                       value={state.additionalVideoInfo} onChange={onChange} disabled={cantEdit}/>
                        </Row>]) : null
                }
            </Container>
        </Card>
    );
});

function mapStateToProps({users, auth}) {
    return {users, auth};
}
