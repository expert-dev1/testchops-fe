import React from "react";
import {Line} from "react-chartjs-2";

export default ({data}) => {

    let set = data.map(obj => ({
        ...obj,
        plot: Object.keys(obj.plot).map(key => ({x: key, y: obj.plot[key]})),
    }));

    set = {
        datasets: set.map(datum => ({
            label: datum.key,
            borderColor: datum.borderColor,
            backgroundColor: datum.background,
            fill: false,
            data: datum.plot
        }))
    };

    const options = {
        responsive: true,
        hoverMode: 'index',
        scales: {
            xAxes: [{
                type: 'time',
                time: {
                    unit: 'day'
                },
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Date'
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Count'
                }
            }]
        }
    };

    return (
        <Line data={set} options={options}/>
    );
}
