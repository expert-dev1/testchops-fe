import React, {useState} from "react";
import {axiosClient} from '../api/httpClient';
import {
    Button,
    Card,
    CardPanel,
    CardTitle,
    Col,
    Container,
    Icon,
    Modal,
    ProgressBar,
    Row,
    Select,
    TextInput
} from "react-materialize";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {connect} from "react-redux";
import * as actions from '../actions';
import * as _ from "lodash";
import {Link} from "react-router-dom";
import {errorToast, generateRandomPassword, getUserOptions, infoToast, isEditor, successToast} from "../api/Util";
import ConfirmationDialog from "./ConfirmationDialog";
import {ADMIN, QA_USER, TEAM_LEAD, YT_HELPER, YT_HELPER_LEAD} from "../api/Constants";

function populateUsers(props, confirmationOpen, setConfirmationOpen, onConfirmDelete, setOnConfirmDelete) {
    if (!props.users && !props.users.loadingUsers) {
        props.fetchAllUsers();
        return (
            <ProgressBar/>
        );
    }
    if (_.isEmpty(props.users.users)) {
        return (
            <CardPanel style={{padding: "12px", textAlign: "center"}}>
                <span style={{fontSize: "1.1em"}}>No users found</span>
            </CardPanel>
        );
    }

    function onClickDelete(e, user) {
        setOnConfirmDelete((event) => () => deleteUser(event, user));
        setConfirmationOpen(true);
    }

    async function deleteUser(e, user) {
        try {
            let response = await axiosClient.delete('/api/user/' + user.client_id);
            successToast(response.data.message);
            props.removeUser(user);
        } catch (err) {
            errorToast(err.data.message || "Unable to delete user");
        }
        setConfirmationOpen(false);
    }

    const confirmationDialogId = "userDeleteConfirmationDialog";

    return (
        <Container>
            <ConfirmationDialog
                onNegative={() => setConfirmationOpen(false)}
                onPositive={onConfirmDelete}
                confirmationHeader="Caution"
                confirmationDialogId={confirmationDialogId}
                confirmation={confirmationOpen}
                confirmationText="Are you sure you want to delete user?"
            />
            {
                _.map(props.users.users, (user) => {
                    return (
                        <Col s={12} m={6} l={3} key={`user-${user.client_id}`}>
                            {user.client_type !== 'customer'?
                            <Card
                                header={<CardTitle className="user-card-title" image="">
                                    <Link to={`/user/${user.client_id}/profile`}>{user.fullname}</Link>
                                </CardTitle>}
                                style={{minHeight: "40vh"}}
                                actions={[
                                    <Button key={`delete-${user.client_id}`} onClick={e => onClickDelete(e, user)}
                                            className="btn-danger">
                                        Delete <Icon right>delete_forever</Icon>
                                    </Button>
                                ]}>
                                <Container style={{marginTop: "10px"}}>
                                    <Row>
                                        <Col s={12}>
                                            <FontAwesomeIcon
                                                icon="user-tag"/>&nbsp;{(user.client_type || "").toUpperCase()}
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col s={12}>
                                            <FontAwesomeIcon icon="users"/>&nbsp;{user.client_type === 'team-lead'
                                            ?"Assigned QA:":'Assigned customers:' }
                                            {user.client_type === 'team-lead'? user.assigned_qa:user.assigned_customers}
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col s={12}>
                                            <FontAwesomeIcon icon="at"/>&nbsp;<a target="_blank" rel="noopener noreferrer"
                                            href={`mailto:${user.useremail}`}>{user.useremail}</a>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col s={12}>
                                            <span>
                                                <FontAwesomeIcon icon="at"/>&nbsp;Alternate:
                                                {
                                                    user.secondary_email ? (
                                                        <a target="_blank" rel="noopener noreferrer" href={`mailto:${user.secondary_email}`}>{user.secondary_email || 'NA'}</a>
                                                    ) : ""
                                                }
                                            </span>
                                        </Col>
                                    </Row>
                                </Container>
                            </Card>
                            :''}
                        </Col>
                    );
                })
            }
        </Container>
    );
}

export default connect(mapStateToProps, actions)((props) => {
    let [firstName, setFirstName] = useState("");
    let [lastName, setLastName] = useState("");
    let [email, setEmail] = useState("");
    let [password, setPassword] = useState("");
    let [type, setType] = useState(QA_USER);
    let [teamLead, setTeamLead] = useState("0");
    let [disableTeamLead, setDisableTeamLead] = useState(true);
    let [modalOpen, setModalOpen] = useState(false);
    let [addDisabled, setAddDisabled] = useState(false);
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [onConfirmDelete, setOnConfirmDelete] = useState(() => {});

    async function addUser(e) {
        setAddDisabled(true);
        try {
            e.preventDefault();
            let response = await axiosClient.post('/api/user',
                {
                    firstname: firstName, lastname: lastName, email, password, customer_type: type,
                    assign_team_lead: disableTeamLead ? null : Number(teamLead)
                });
            successToast(response.data.message);
            setAddDisabled(false);
            if (response.data && !_.isEmpty(response.data.entity)) {
                props.addUser(response.data.entity);
            }
            setModalOpen(false);
        } catch (err) {
            errorToast('Something went wrong: ' + err.message);
            setAddDisabled(false);
        }
    }

    function setRandomPassword() {
        setPassword(generateRandomPassword);
    }

    function resetFields() {
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setType(QA_USER);
        setDisableTeamLead(false);
        setTeamLead("0");
    }

    function onUserTypeChange(e) {
        setType(e.target.value);
        setTeamLead("0");
        if (isEditor({client_type: e.target.value})) {
            setDisableTeamLead(false);
        } else {
            setDisableTeamLead(true);
        }
    }

    return (
        <Container style={{padding: '20px'}}>
            <Row>
                <Col s={6} m={3}>
                    <CardPanel style={{padding: "12px", textAlign: "center", cursor: "pointer"}}
                               className="red darken-1"
                               onClick={() => {
                                   props.fetchAllUsers();
                                   infoToast("Reloading users")
                               }}>
                        <FontAwesomeIcon icon="sync" inverse/>&nbsp;&nbsp;<span className="text-primary"
                                                                                style={{fontSize: "1.1em"}}>Users</span>
                    </CardPanel>
                </Col>
                <Col s={6} m={3} push="s0 m6">
                    <Modal
                        actions={[
                            <Button flat modal="close" node="button" className="btn-danger" large>Close</Button>,
                            <Button modal="close" onClick={e => addUser(e)} disabled={addDisabled} node="button"
                                    waves="green" className="btn-primary" large>Add</Button>
                        ]}
                        trigger={(
                            <CardPanel style={{padding: "12px", textAlign: "center", cursor: "pointer"}}
                                       className="color-green" >
                                <FontAwesomeIcon icon="plus" inverse/>&nbsp;&nbsp;
                                <span className="text-primary" style={{fontSize: "1.1em"}}>Add User</span>
                            </CardPanel>
                        )}
                        header="Add New User"
                        id="addUserModal"
                        open={modalOpen}
                        style={{height: '60%'}}
                        options={{
                            dismissible: true,
                            endingTop: '10%',
                            opacity: 0.5,
                            preventScrolling: true,
                            onOpenStart: resetFields,
                            onCloseEnd: () => setModalOpen(false)
                        }}
                    >
                        <Container>
                            <Row>
                                <TextInput s={12} m={6} id="txtFirstName" label="First Name" icon="person"
                                           value={firstName} onChange={e => setFirstName(e.target.value)}/>
                                <TextInput s={12} m={6} id="txtLastName" label="Last Name" icon="person"
                                           value={lastName} onChange={e => setLastName(e.target.value)}/>
                            </Row>
                            <Row>
                                <TextInput s={12} m={6} id="txtEmail" label="Email" email validate icon="email"
                                           value={email} onChange={e => setEmail(e.target.value)}/>
                                <TextInput s={12} m={6} icon={<Button flat
                                                                      onClick={e => setRandomPassword()}><Icon>lock</Icon></Button>}
                                           id="txtPassword" label="Password"
                                           value={password} onChange={e => setPassword(e.target.value)}/>
                            </Row>
                            <Row>
                                <Select s={12} m={6}
                                        icon={<Icon>assignment</Icon>}
                                        id="clientType"
                                        label="User Type"
                                        value={type}
                                        onChange={e => onUserTypeChange(e)}>
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
                                <Select s={12} m={6}
                                        icon={<Icon>supervisor_account</Icon>}
                                        id="assignTeamLead"
                                        label="Team Lead"
                                        value={teamLead}
                                        disabled={disableTeamLead}
                                        onChange={e => setTeamLead(e.target.value)}>
                                    <option value="0">
                                        None
                                    </option>
                                    {getUserOptions(props.users.users, TEAM_LEAD)}
                                </Select>
                            </Row>
                        </Container>
                    </Modal>
                </Col>
            </Row>
            <Row>
                {populateUsers(props, confirmationOpen, setConfirmationOpen, onConfirmDelete, setOnConfirmDelete)}
            </Row>
        </Container>
    );
});

function mapStateToProps({users}) {
    return {users};
}
