import React from "react";
import {Button, Modal} from "react-materialize";

export default (props) => {
    return (
        <Modal
            actions={[
                <Button flat onClick={props.onNegative} modal="close" node="button" waves="red" large style={{marginLeft: "10px"}}>
                    {props.negativeText || "No"}
                </Button>,
                <Button onClick={props.onPositive} modal="close" node="button" waves="green" className="btn-primary" large style={{marginLeft: "10px"}}>
                    {props.positiveText || "Yes"}
                </Button>
            ]}
            header={props.confirmationHeader}
            id={props.confirmationDialogId}
            open={props.confirmation}
            style={{minHeight: "25vh"}}
            options={{
                dismissible: true,
                startingTop: '4%',
                endingTop: '10%',
                opacity: 0.5,
                preventScrolling: true,
                onCloseEnd: props.onNegative
            }}
        >
            {props.confirmationText}
        </Modal>
    );
}
