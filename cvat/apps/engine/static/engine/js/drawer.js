/* exported DrawerModel DrawerController DrawerView */
"use strict";

class DrawerModel extends Listener  {
    constructor(trackCollection) {
        super('onDrawerUpdate', getState);
        this._drawMode = false;
        this._drawShape = 'skel';
        this._collection = trackCollection;
        this._trackType = 'interpolation';//null;
        this._label = null;
        this._clicks = [];
        this._drawObjectEvent = null;
        this._pasteMode = false;
        this._mergeMode = false;
        this._AAM = false;
        //Adding standard skeleton layout (relative to chest/center)


        let self = this;
        function getState() {
            return self;
        }
    }

    switchDraw() {
        if (this._drawMode) this.endDraw();
        else this.startDraw();
        this.notify();
    }

    endDraw() {
        //
        this._drawMode = false;
        this._clicks = [];
        //this._trackType = null;
        this._label = null;
        this._drawObjectEvent = null;


    }

    startDraw() {
        if (this._pasteMode || this._mergeMode || this._AAM) return;
        this._drawMode = true;
        this._drawObjectEvent = Logger.addContinuedEvent(Logger.EventType.drawObject);
    }

    addPoint(pos) {
        if (!this._drawMode) return;
        if (this._drawShape === 'rect') {



            for (let i = 0; i < this._clicks.length; i ++) {
                if (!this._clicks[i].fixed) {
                    this._clicks.splice(i,1);
                }
            }

            if (this._clicks.length) {


                let diffX = Math.abs(this._clicks[0].x - pos.x);
                let diffY = Math.abs(this._clicks[0].y - pos.y);
                if (diffX >= MIN_BOX_SIZE && diffY >= MIN_BOX_SIZE) {
                    this._clicks.push(pos);
                    if (pos.fixed) {
                        let rectPos = {
                            xtl: Math.min(this._clicks[0].x, this._clicks[1].x),
                            ytl: Math.min(this._clicks[0].y, this._clicks[1].y),
                            xbr: Math.min(this._clicks[0].x, this._clicks[1].x) + Math.abs(this._clicks[0].x - this._clicks[1].x),
                            ybr: Math.min(this._clicks[0].y, this._clicks[1].y) + Math.abs(this._clicks[0].y - this._clicks[1].y)
                        };

                        this._collection.createFromPos(rectPos, this._label, this._trackType);

                        Logger.addEvent(Logger.EventType.addObject, {count: 1});
                        this._drawObjectEvent.close();
                        this.endDraw();
                    }
                }
            }
            else {
                this._clicks.push(pos);
            }
            this.notify();

        }

        else throw new Error('Unknown shape type when draw');
    }

    addSkeleton(skel) {
        if (!this._drawMode) return;
        if (this._drawShape === 'skel') {

            let skelPos = [];

            var keyp;

            for(keyp = 0;keyp < skel.length; keyp++){
               skelPos[keyp] =  [skel[keyp][0].cx.animVal.value,              // x
                                 skel[keyp][0].cy.animVal.value,              // y
                                 skel[keyp][0].attributes.name.value,         // name
                                 skel[keyp][0].attributes.visibility.value]; // visibility
                                                        //TODO: (default visible,
                                                        // can change this)
            }
            this._collection.createFromSkel(skelPos, this._label, this._trackType);
            //Logger.addEvent(Logger.EventType.addObject, {count: 1});
            this._drawObjectEvent.close();
            this.endDraw();



            this.notify();


        }

        else throw new Error('Unknown shape type when draw')
    }

    get drawMode() {
        return this._drawMode;
    }

    get clicks() {
        return this._clicks;
    }

    get drawShape() {
        return this._drawShape;
    }

    set label(value) {
        this._label = value;
    }

    set trackType(value) {
        this._trackType = value;
    }

    onBufferUpdate(buffer) {
        this._pasteMode = buffer.pasteMode;
    }

    onMergerUpdate(merger) {
        this._mergeMode = merger.mergeMode;
    }

    onAAMUpdate(aam) {
        this._AAM = aam.activeAAM;
        if (this._AAM && this._drawMode) {
            this.endDraw();
            this.notify();
        }
    }
}



class DrawerController {
    constructor(drawerModel) {
        this._model = drawerModel;
        setupDrawerShortkeys.call(this);

        function setupDrawerShortkeys() {
            let drawHandler = Logger.shortkeyLogDecorator(function() {
                this.onDrawPressed();
            }.bind(this));

            let shortkeys = userConfig.shortkeys;

            Mousetrap.bind(shortkeys["switch_draw_mode"].value, drawHandler, 'keydown');
        }
    }

    onDrawPressed() {
        this._model.switchDraw();
    }

    onAddPoint(pos) {
        this._model.addPoint(pos);
    }

    onAddSkeleton(skel){
        this._model.addSkeleton(skel);
    }
}



class DrawerView {
    constructor(drawerController) {
        this._controller = drawerController;
        this._drawButton = $('#createTrackButton');
        this._drawLabelSelect = $('#labelSelect');
        //this._drawTrackTypeSelect = $('#trackTypeSelect');
        this._frameContent = $('#frameContent');
        this._drawMode = false;
        this._drawShapeType = null;
        this._aim = {
            aimX: null,
            aimY: null
        };
        this._drawShape = null;
        this._drawConnectors = null;
        this._playerScale = 1;


                    //  x , y
        this._layout = [[0,-15], //nose
                      [-1,-15], //left eye
                      [1,-15], //right eye
                      [-2,-15], //left ear
                      [2,-15], //right ear
                      [-3,-10], //left shoulder
                      [3,-10], //right shoulder
                      [-4,-3], //left elbow
                      [4,-3], //right elbow
                      [-3.5,0], //left wrist
                      [3.5,0], //right wrist
                      [-2,2], //left hip
                      [2,2], //right hip
                      [-3,6], //left knee
                      [3,6], //right knee
                      [-3.5,10], //left ankle
                      [3.5,10], //right ankle
                      [0,-3]];  // center (will be displayed in different color)
        this._connections = [[16,14],
                            [14,12],
                            [17,15],
                            [15,13],
                            [12,13],
                            [6,12],
                            [7,13],
                            [6,7],
                            [6,8],
                            [7,9],
                            [8,10],
                            [9,11],
                            [2,3],
                            [1,2],
                            [1,3],
                            [2,4],
                            [3,5],
                            [4,6],
                            [5,7]];

        this._keypoint_names = ["nose",
                                "left eye",
                                "right eye",
                                "left ear",
                                "right ear",
                                "left shoulder",
                                "right shoulder",
                                "left elbow",
                                "right elbow",
                                "left wrist",
                                "right wrist",
                                "left hip",
                                "right hip",
                                "left knee",
                                "right knee",
                                "left ankle",
                                "right ankle",
                                "center"];


        this._drawButton.on('click', () => this._controller.onDrawPressed.call(this._controller));
    }

    onDrawerUpdate(drawer) {
        if (drawer.drawMode) {
            if (!this._drawMode) {
                this._drawButton.text('Cancel Draw (N)');

                this._frameContent.on('mousemove.drawer', mousemoveHandler.bind(this));
                this._frameContent.on('mouseleave.drawer', mouseleaveHandler.bind(this));
                this._frameContent.on('mousedown.drawer', mousedownHandler.bind(this));

                this._drawMode = true;
                this._drawShapeType = drawer.drawShape;
                if (this._drawShapeType == 'rect') {
                    this._drawShape = $(document.createElementNS('http://www.w3.org/2000/svg', 'rect')).attr({
                        'stroke': '#ffffff'
                    }).addClass('shape').css({
                        'stroke-width': 2 / this._playerScale,
                    }).appendTo(this._frameContent);

                    this._aim = {
                    aimX: $(document.createElementNS('http://www.w3.org/2000/svg', 'line')).attr({
                        'stroke': 'red',
                    }).css({
                        'stroke-width': 2 / this._playerScale
                    }).appendTo(this._frameContent)
                    ,
                    aimY: $(document.createElementNS('http://www.w3.org/2000/svg', 'line')).attr({
                        'stroke': 'red',
                    }).css({
                        'stroke-width': 2 / this._playerScale
                    }).appendTo(this._frameContent)};


                }
                else if (this._drawShapeType == 'skel'){

                    this._drawShape = [];


                    var keyp;
                    for (keyp = 0; keyp<this._layout.length;keyp++){

                        if (!(keyp == this._layout.length-1)){
                        this._drawShape[keyp] = $(document.createElementNS('http://www.w3.org/2000/svg', 'circle')).attr({
                         'stroke': '#ffff00', 'fill' : 'yellow','r':5
                     }).addClass('shape').css({
                         'stroke-width': 2 / this._playerScale,
                     }).appendTo(this._frameContent);
                        }
                        else{
                        this._drawShape[keyp] = $(document.createElementNS('http://www.w3.org/2000/svg', 'circle')).attr({

                            'stroke': '#00ff00', 'fill' : '#00ff00','r':7

                     }).addClass('shape').css({
                         'stroke-width': 2 / this._playerScale,
                     }).appendTo(this._frameContent);
                        }

                    }
                    var conn;
                    this._drawConnectors = [];
                    for(conn = 0;conn <this._connections.length;conn++){

                        this._drawConnectors[conn]=$(document.createElementNS('http://www.w3.org/2000/svg', 'line')).attr({
                        'stroke': 'red',
                    }).css({
                        'stroke-width': 1 / this._playerScale //2 / this._playerScale
                    }).appendTo(this._frameContent)
                    }

                    // this._drawShape = $(document.createElementNS('http://www.w3.org/2000/svg', 'circle')).attr({
                    //     'stroke': '#ffffff', 'fill' : '#ffffff','r':2
                    // }).addClass('shape').css({
                    //     'stroke-width': 2 / this._playerScale,
                    // }).appendTo(this._frameContent);

                }



                drawer.label = +this._drawLabelSelect.prop('value');
                //drawer.trackType = this._drawTrackTypeSelect.prop('value');
            }
            else {
                let clicks = drawer.clicks;
                if (this._drawShapeType == 'rect' && clicks.length == 2) {
                    this._drawShape.attr({
                        x: Math.min(clicks[0].x, clicks[1].x),
                        y: Math.min(clicks[0].y, clicks[1].y),
                        width: Math.abs(clicks[0].x - clicks[1].x),
                        height: Math.abs(clicks[0].y - clicks[1].y)
                    });
                }
                else if (this._drawShapeType === 'skel' && clicks.length == 2){

                    // Just try creating keypoints first and then decide on behavior.

                }
            }
        }
        else {
            if (this._drawMode) {


                this._drawButton.text('Create Track');

                this._frameContent.off('mousemove.drawer');
                this._frameContent.off('mouseleave.drawer');
                this._frameContent.off('mousedown.drawer');

                this._drawMode = false;

                if (this._drawShapeType == 'skel'){

                    var i;
                    let ds_l = this._drawShape.length;
                    let dc_l = this._drawConnectors.length;
                    for (i = 0; i < ds_l; i++){
                        this._drawShape[i].remove();
                    }
                    for (i = 0; i < dc_l; i++){
                        this._drawConnectors[i].remove();
                    }
                }
                else{
                    this._drawShape.remove();
                    this._aim.aimX.remove();
                    this._aim.aimY.remove();
                }

                this._drawShape = null;
                this._drawConnectors = null;

                this._aim.aimX = null;

                this._aim.aimY = null;
                this._drawShapeType = null;


            }
        }

        this._drawLabelSelect.prop('disabled', this._drawMode);
        //this._drawTrackTypeSelect.prop('disabled', this._drawMode);

        function mousemoveHandler(e) {

            let pos = translateSVGPos(this._frameContent['0'], e.clientX, e.clientY, this._playerScale);
            pos.fixed = false;

            if (this._drawShapeType == 'rect') {

                this._controller.onAddPoint(pos);

                this._aim.aimX.attr({
                    x1: 0,
                    y1: pos.y,
                    x2: this._frameContent.css('width'),
                    y2: pos.y
                }).css('display', '');

                this._aim.aimY.attr({
                    x1: pos.x,
                    y1: 0,
                    x2: pos.x,
                    y2: this._frameContent.css('height')
                }).css('display', '');
            }
            else if (this._drawShapeType == 'skel') {

                for (keyp = 0; keyp < this._layout.length; keyp++) {

                    this._drawShape[keyp].attr({
                        cx: pos.x + this._layout[keyp][0]*10,
                        cy: pos.y + this._layout[keyp][1]*10,
                        name :this._keypoint_names[keyp],
                        visibility : 2
                    }).css('display', '');


                }

                 for (conn = 0; conn < this._connections.length; conn++){
                     this._drawConnectors[conn].attr({
                         x1: this._drawShape[this._connections[conn][0]-1][0].cx.animVal.value,
                         y1: this._drawShape[this._connections[conn][0]-1][0].cy.animVal.value,
                         x2: this._drawShape[this._connections[conn][1]-1][0].cx.animVal.value,
                         y2: this._drawShape[this._connections[conn][1]-1][0].cy.animVal.value
                     }).css('display','');
                 }

            }
        }
        function mouseleaveHandler() {
            if (this._drawMode) {

                if(this._drawShapeType == 'rect') {
                    this._aim.aimX.css('display', 'none');
                    this._aim.aimY.css('display', 'none');
                }
            }
        }

        function mousedownHandler(e) {
            if (e.shiftKey) return;
            let pos = translateSVGPos(this._frameContent['0'], e.clientX, e.clientY, this._playerScale);
            pos.fixed = true;

            if(this._drawShapeType == 'rect'){
                this._controller.onAddPoint(pos);
            }
            else if (this._drawShapeType == 'skel'){
                this._controller.onAddSkeleton(this._drawShape);
            }

        }
    }

    onPlayerUpdate(player) {


        this._playerScale = player.geometry.scale;
        if (this._drawMode) {

            if(this._drawShapeType == 'rect'){
            this._aim.aimX.css({
                'stroke-width': 2 / this._playerScale
            });
            this._aim.aimY.css({
                'stroke-width': 2 / this._playerScale
            });
            this._drawShape.css({
                'stroke-width': 2 / this._playerScale
            });
            }
            else if (this._drawShapeType == 'skel'){

                //TODO: define behavior when we change frames
            }

        }
    }
}
