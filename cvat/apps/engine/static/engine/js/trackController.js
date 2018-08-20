/* exported TrackController */
"use strict";

class TrackController {
    constructor(trackModel) {
        this._trackModel = trackModel;
    }

    onclick() {
        this._trackModel.onSelect();
    }

    /*
    onclickkeypoint(ind){
        this._trackModel.onSelectKeypoint(ind);
    }
    */
    //TODO: this will have to change for editing
    onchangegeometry(shape) {
        let pos = {
            xtl:    +shape.attr('x'),
            ytl:    +shape.attr('y'),
            xbr:    +shape.attr('width') + +shape.attr('x'),
            ybr:    +shape.attr('height') + +shape.attr('y'),
            outsided: 0,
            occluded: shape.hasClass('occludedShape') ? 1 : 0
        };
        this._trackModel.recordPosition(pos);
    }

    onchangekeypointgeometry(shape){

        var skel = [];
        for(var i=0; i< shape.length; i++){

           skel[i] =  [$(shape[i][0]).attr('cx'),
                       $(shape[i][0]).attr('cy'),
                       $(shape[i][0]).attr('name'),
                       $(shape[i][0]).attr('visibility')];
        }

        var outsided;

        var pos = {
            skel: skel,
            outsided: 0, //TODO: OUTSIDED (using placeholder for now)
            occluded: 0 //TODO: VISIBILITY
        }

        this._trackModel.recordPosition(pos);
    }
}
