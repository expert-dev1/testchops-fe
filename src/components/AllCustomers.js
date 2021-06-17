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
import {errorToast, generateRandomPassword, getUserOptions, infoToast, isTrue, successToast} from "../api/Util";
import ConfirmationDialog from "./ConfirmationDialog";
import {CUSTOM, DOUBLE, QA_USER, SINGLE, UNLIMITED, WEEKLY} from "../api/Constants";

function populateCustomers(props, confirmationOpen, setConfirmationOpen, onConfirmDelete, setOnConfirmDelete) {
    if(!props?.users?.users && !props.users.loadingUsers) {
        props.fetchAllUsers();
    }

    if (!props.users && !props.users.loadingCustomers) {
        props.fetchAllCustomers();
        return (
            <ProgressBar/>
        );
    }
    if (_.isEmpty(props?.users?.customers)) {
        return (
            <CardPanel style={{padding: "12px", textAlign: "center"}}>
                <span style={{fontSize: "1.1em"}}>No customers found</span>
            </CardPanel>
        );
    }

    function onClickDelete(e, user) {
        setOnConfirmDelete((event) => () => deleteUser(event, user));
        setConfirmationOpen(true);
    }

    function onClickDeactivate(e, user) {
        axiosClient.post(`/api/user/${user.client_id}/toggleUserSubscription`, {
            client_id: user.client_id, is_active_subscription: user.is_active_subscription ? 0 : 1
        }).then(({data}) => {
            successToast(data.status || "Status updated");
            props.fetchAllCustomers();
        }).catch(err => {
           errorToast("Something went wrong");
           console.error(err);
        });
    }

    function renewSubscription(clientId) {
        if (window.confirm('Are you sure you want to renew subscription?')) {
            axiosClient.post(`/api/user/${clientId}/renewSubscription`)
                .then(({data}) => {
                    if(data.success) {
                        successToast("Subscription renewed");
                    } else {
                        errorToast("Couldn't renew subscription, please try again");
                    }
                }).catch(err => {
                    console.error(err);
                    errorToast('Something went wrong when renewing subscription');
            });
        }
    }

    async function deleteUser(e, user) {
        try {
            let response = await axiosClient.delete('/api/user/' + user.client_id);
            successToast(response.data.message);
            props.removeCustomer(user);
        } catch (err) {
            errorToast(err.data.message || "Unable to delete customer");
        }
        setConfirmationOpen(false);
    }

    return (
        <Container>
            <ConfirmationDialog
                onNegative={() => setConfirmationOpen(false)}
                onPositive={onConfirmDelete}
                confirmationHeader="Caution"
                confirmationDialogId="customerDeleteConfirmationDialog"
                confirmation={confirmationOpen}
                confirmationText="Are you sure you want to delete customer?"
            />
            {
                _.map(props.users.customers, (user) => {
                    return (
                        <Col s={12} m={6} l={3} key={`customer-${user.client_id}`}>
                            <Card
                                header={<CardTitle className="user-card-title" image="">
                                    <Link to={`/user/${user.client_id}/profile`}>{user.fullname}</Link>
                                </CardTitle>}
                                actions={[
                                    <Button key={`delete-${user.client_id}`} onClick={e => onClickDelete(e, user)}
                                            className="btn-danger" style={{width: "50%"}}>
                                        Delete <Icon right>delete_forever</Icon>
                                    </Button>,
                                    <Button key={`inactive-${user.client_id}`} onClick={e => onClickDeactivate(e, user)}
                                            className={user.is_active_subscription ? "btn-danger" : "btn-primary"} style={{width: "50%"}}>
                                        {user.is_active_subscription ? "Deactivate" : "Activate"}<Icon right>check</Icon>
                                    </Button>
                                ]}>
                                <Container style={{marginTop: "10px", minHeight: "280px"}}>
                                    <Row>
                                        <Col s={12}>
                                            <FontAwesomeIcon icon="user-tag"/>&nbsp;{(user.subscription_type || "")}
                                            {user.subscription_type === CUSTOM && user.custom_subscription ? `: ${user.custom_subscription}` : null}
                                            &nbsp;&nbsp;
                                            {
                                                user.subscription_type === SINGLE ?
                                                    <Button tooltip="Renew subscription" icon={<Icon>refresh</Icon>}
                                                            onClick={() => renewSubscription(user.client_id)} />
                                                    : null
                                            }
                                        </Col>
                                    </Row>
                                    {
                                        isTrue(user.has_subtitles) &&
                                            <Row>
                                                <Col s={12}>
                                                    <FontAwesomeIcon icon="plus-square"/>&nbsp;Has Subtitles
                                                </Col>
                                            </Row>
                                    }
                                    {
                                        isTrue(user.has_youtube_helper) &&
                                            <Row>
                                                <Col s={12}>
                                                    <FontAwesomeIcon icon="plus-square"/>&nbsp;Has Youtube Helper
                                                </Col>
                                            </Row>
                                    }
                                    <Row>
                                        <Col s={12}>
                                            <FontAwesomeIcon icon="at"/>&nbsp;<a
                                            href={`mailto:${user.useremail}`}>{user.useremail}</a>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col s={12}>
                                            <span>
                                                <FontAwesomeIcon icon="at"/>&nbsp;Alternate:
                                                {
                                                    user.secondary_email &&
                                                    (<a target="_blank" rel="noopener noreferrer" href={`mailto:${user.secondary_email}`}>{user.secondary_email || 'NA'}</a>)
                                                }
                                            </span>
                                        </Col>
                                    </Row>
                                    {
                                        user?.assigned?.map(assignment => (<Row key={"assignment-" + assignment.client_id}>
                                            <Col s={12}>
                                                <FontAwesomeIcon icon="user-tie"/>&nbsp;Assigned: <Link
                                                to={`/user/${assignment.client_id}/profile`}>{assignment.name} ({assignment.client_type})</Link>
                                            </Col>
                                        </Row>))
                                    }
                                </Container>
                            </Card>
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
    let [type, setType] = useState(SINGLE);
    let [customType, setCustomType] = useState('');
    let [qa, setQa] = useState("0");
    let [modalOpen, setModalOpen] = useState(false);
    let [addDisabled, setAddDisabled] = useState(false);
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [onConfirmDelete, setOnConfirmDelete] = useState(() => {});

    async function addCustomer(e) {
        setAddDisabled(true);
        try {
            e.preventDefault();
            let response = await axiosClient.post('/api/user',
                {
                    firstname: firstName, lastname: lastName, email, password, custom_subscription: customType,
                    subscription_type: type, assign_qa: qa === "0" ? null : [Number(qa)]
                });
            successToast(response.data.message);
            setAddDisabled(false);
            if (response.data && !_.isEmpty(response.data.entity)) {
                props.addCustomer(response.data.entity);
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
        setType(SINGLE);
        setQa("0");
    }

    return (
        <Container style={{padding: '20px'}}>
            <Row>
                <Col s={6} m={3}>
                    <CardPanel style={{padding: "12px", textAlign: "center", cursor: "pointer"}}
                               className="red darken-1"
                               onClick={() => {
                                   props.fetchAllCustomers();
                                   infoToast("Reloading customers")
                               }}>
                        <FontAwesomeIcon icon="sync" inverse/>&nbsp;&nbsp;<span className="text-primary"
                                                                                style={{fontSize: "1.1em"}}>Customers</span>
                    </CardPanel>
                </Col>
                <Col s={6} m={3}>
                    <CardPanel style={{padding: "12px", textAlign: "center"}}>
                        <FontAwesomeIcon icon="users"/>&nbsp;&nbsp;
                        <span className="text-accent-1" style={{fontSize: "1.1em"}}>Active: {props?.users?.customers
                            ?.reduce((count, customer) => count + (customer.is_active_subscription), 0)}</span>
                    </CardPanel>
                </Col>
                <Col s={6} m={3}>
                    <CardPanel style={{padding: "12px", textAlign: "center"}}>
                        <FontAwesomeIcon icon="users"/>&nbsp;&nbsp;
                        <span className="text-darken-1" style={{fontSize: "1.1em"}}>Inactive: {props?.users?.customers
                            ?.reduce((count, customer) => count + (!customer.is_active_subscription), 0)}</span>
                    </CardPanel>
                </Col>
                <Col s={6} m={3}>
                    <Modal
                        actions={[
                            <Button flat modal="close" node="button" className="btn-danger" large>Close</Button>,
                            <Button modal="close" onClick={e => addCustomer(e)} disabled={addDisabled} node="button"
                                    waves="green" className="btn-primary" large>Add</Button>
                        ]}
                        trigger={(
                            <CardPanel style={{padding: "12px", textAlign: "center", cursor: "pointer"}}
                                       className="color-green" >
                                <FontAwesomeIcon icon="plus" inverse/>&nbsp;&nbsp;
                                <span className="text-primary" style={{fontSize: "1.1em"}}>Add Customer</span>
                            </CardPanel>
                        )}
                        header="Add New Customer"
                        id="addCustomerModal"
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
                                <TextInput s={12} m={6} icon={<Button flat onClick={setRandomPassword}><Icon>lock</Icon></Button>}
                                           id="txtPassword" label="Password"
                                           value={password} onChange={e => setPassword(e.target.value)}/>
                            </Row>
                            <Row>
                                <Select s={12} m={6}
                                        icon={<Icon>subscriptions</Icon>}
                                        id="subscriptionType"
                                        label="Customer Type"
                                        value={type}
                                        onChange={e => setType(e.target.value)}>
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
                                <Select s={12} m={6}
                                        icon={<Icon>supervisor_account</Icon>}
                                        id="assignQa"
                                        label="Assign QA"
                                        value={qa}
                                        onChange={e => setQa(e.target.value)}>
                                    <option value="0">
                                        None
                                    </option>
                                    {getUserOptions(props.users.users, QA_USER)}
                                </Select>
                            </Row>
                            {
                                type === CUSTOM &&
                                    <Row>
                                        <TextInput s={12} m={6} id="txtCustomSub" label="Custom Plan" icon="list"
                                                   value={customType} onChange={e => setCustomType(e.target.value)}/>
                                    </Row>
                            }
                        </Container>
                    </Modal>
                </Col>
            </Row>
            <Row>
                {populateCustomers(props, confirmationOpen, setConfirmationOpen, onConfirmDelete, setOnConfirmDelete)}
            </Row>
        </Container>
    );
});

function mapStateToProps({users}) {
    return {users};
}
