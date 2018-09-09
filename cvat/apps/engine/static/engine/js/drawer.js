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
               skelPos[keyp] =  [$(skel[keyp]).attr('cx'),
                                 $(skel[keyp]).attr('cy'),
                                 $(skel[keyp]).attr('name'),
                                 $(skel[keyp]).attr('visibility')]
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

            //Mousetrap.bind(shortkeys["switch_draw_mode"].value, drawHandler, 'keydown');
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
        this._drawKeypointTexts = null;
        this._ctrlDown = false;
        this._drawConnectors = null;
        this._playerScale = 1;

        this._colorIndex = this._controller._model._collection._allTracks.length;

        this._layout_length = 14;

        this._layout = {'nose' : [0,-15],
                       'shoulder' : {'left' : [-3,-10], 'right' : [3,-10]},
                       'elbow' : {'left' : [-4,-3], 'right' : [4,-3]},
                       'wrist' : {'left' : [-3.5,0], 'right' : [3.5,0]},
                       'hip' : {'left' : [-2,2], 'right' : [2,2]},
                       'knee' : {'left' : [-3,6], 'right' : [3,6]},
                       'ankle' : {'left' : [-3.5,10], 'right' : [3.5,10]},
                       'center' : [0,-3],
                       'flip' : false};

        this._keypoint_names = ["nose",
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

        let kp = this._keypoint_names;

        this._connections = [[kp[1-1],kp[2-1]],
                            [kp[1-1],kp[3-1]],
                            [kp[2-1],kp[3-1]],
                            [kp[2-1],kp[4-1]],
                            [kp[3-1],kp[5-1]],
                            [kp[6-1],kp[4-1]],
                            [kp[7-1],kp[5-1]],
                            [kp[8-1],kp[2-1]],
                            [kp[9-1],kp[3-1]],
                            [kp[10-1],kp[8-1]],
                            [kp[11-1],kp[9-1]],
                            [kp[12-1],kp[10-1]],
                            [kp[13-1],kp[11-1]]];


         this._colorSets = {

            background: ["#FFFFCC", "#FFFF66", "#FFCC66", "#FF9900", "#FF6633", "#FF6666", "#FF9999",
                "#FF6699", "#27EBF9", "#FF99CC", "#FF99FF", "#CC66FF", "#CC99FF", "#16E532",
                "#6666FF", "#0099FF", "#66CCCC", "#99FFFF", "#99FFCC", "#66FF99", "#CCFF99"],

            border: ["#FFFF66", "#FFFF00", "#FFCC00", "#FF6600", "#FF3300", "#CC0033", "#FF3333",
                "#FF0066", "#4EF0FC", "#CC0066", "#FF00FF", "#9900CC", "#9933FF", "#02F423",
                "#3300CC", "#0033FF", "#006666", "#00CCCC", "#00FFCC", "#00FF66", "#66CC00"],

            length: 21
        };

        this._drawButton.on('click', () => this._controller.onDrawPressed.call(this._controller));
    }

    getColors() {
        let oldColorIndex = this._colorIndex;
        this._colorIndex ++;
        if (this._colorIndex >= this._colorSets.length) {
            this._colorIndex = 0;
        }
        var colors = {
            background: this._colorSets.background[oldColorIndex],
            border: this._colorSets.border[oldColorIndex]
        };
        return colors;
    }

    onDrawerUpdate(drawer) {
        if (drawer.drawMode) {
            if (!this._drawMode) {
                this._drawButton.text('Cancel Draw (N)');

                this._frameContent.on('mousemove.drawer', mousemoveHandler.bind(this));
                this._frameContent.on('mouseleave.drawer', mouseleaveHandler.bind(this));
                this._frameContent.on('mousedown.drawer', mousedownHandler.bind(this));
                //this._frameContent.on('keyup.drawer',ctrlKeyUpHandler.bind(this));
                //this._frameContent.on('keypress',ctrlKeyDownHandler);
                Mousetrap.bind('ctrl',ctrlKeyDownHandler.bind(this),'keydown');

                this._drawMode = true;
                this._drawShapeType = drawer.drawShape;
                if (this._drawShapeType == 'rect') {
                    this._drawShape = $(document.createElementNS('http://www.w3.org/2000/svg', 'rect')).attr({
                        'stroke': '#ffffff'
                    }).addClass('shape').appendTo(this._frameContent);//.css({ 'stroke-width': 2 / this._playerScale}).appendTo(this._frameContent);

                    this._aim = {
                    aimX: $(document.createElementNS('http://www.w3.org/2000/svg', 'line')).attr({
                        'stroke': 'red',
                    }).css({
                        'stroke-width': 2 / this._playerScale,
                    }).appendTo(this._frameContent),
                    aimY: $(document.createElementNS('http://www.w3.org/2000/svg', 'line')).attr({
                        'stroke': 'red',
                    }).css({
                        'stroke-width': 2 / this._playerScale,
                    }).appendTo(this._frameContent)};
                }
                else if (this._drawShapeType == 'skel'){

                    this._drawShape = [];
                    this._drawKeypointTexts = [];

                    var keyp;

                    let colors = this.getColors();

                    var conn;
                    this._drawConnectors = [];
                    for(conn = 0;conn <this._connections.length;conn++)
                        {
                        this._drawConnectors[conn]=$(document.createElementNS('http://www.w3.org/2000/svg', 'line')).attr({
                            'stroke': colors.border}).addClass('shape').appendTo(this._frameContent);
                        }
                    }

                    for (keyp = 0; keyp < this._layout_length;keyp++){

                        // (Assumed) not center
                        if (!(keyp == this._layout_length-1)){
                            this._drawShape[keyp] = $(document.createElementNS('http://www.w3.org/2000/svg', 'circle')).attr({
                                 'stroke': 'blue', 'fill' : 'blue','r':5
                             }).addClass('shape').appendTo(this._frameContent);//appendTo(this._frameContent);
                        }
                        else{
                        this._drawShape[keyp] = $(document.createElementNS('http://www.w3.org/2000/svg', 'circle')).attr({
                            'stroke': '#00ff00', 'fill' : '#00ff00','r':7
                     }).addClass('shape').appendTo(this._frameContent);
                        }

                        this._drawKeypointTexts[keyp] = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        $(this._drawKeypointTexts[keyp]).attr({
                            'class': 'regular',
                            'font-size': '1.6em',
                            'fill': 'white',
                            'text-shadow': '0px 0px 3px black',
                            'cursor': 'default'
                        });

                        let labelNameText = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');

                        labelNameText.setAttribute('dy', '1em');
                        labelNameText.setAttribute('class', 'bold');
                        this._drawKeypointTexts[keyp].appendChild(labelNameText);

                        $(this._drawKeypointTexts[keyp]).appendTo(this._frameContent);
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
                this._frameContent.off('keydown.drawer');

                this._drawMode = false;

                if (this._drawShapeType == 'skel'){

                    var i;
                    let ds_l = this._drawShape.length;
                    let dc_l = this._drawConnectors.length;
                    let dk_l = this._drawKeypointTexts.length;
                    for (i = 0; i < ds_l; i++){
                        this._drawShape[i].remove();
                    }
                    for (i = 0; i < dc_l; i++){
                        this._drawConnectors[i].remove();
                    }
                    for (i = 0; i < dk_l; i++){
                        this._drawKeypointTexts[i].remove();
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

                for (keyp = 0; keyp < this._layout_length; keyp++) {

                    if (!this._ctrlDown || !this._drawShape[keyp][0].hasAttribute('name')){
                        this._drawShape[keyp].attr({
                            name: this._keypoint_names[keyp],
                        }).css('display', '');
                    }

                    if(Object.keys(this._layout).includes(this._drawShape[keyp].attr('name'))){

                        // If this keypoint isn't left/right something
                        // redraw with standard layout
                        this._drawShape[keyp].attr({
                            cx: pos.x + this._layout[this._drawShape[keyp].attr('name')][0] * 10,
                            cy: pos.y + this._layout[this._drawShape[keyp].attr('name')][1] * 10,
                            visibility: "2"
                        }).css('display', '');

                    } else{

                        // Otherwise, flip left/right keypoints if ctrl down
                        let side =  this._drawShape[keyp].attr('name').split(" ")[0];
                        let bodypart =  this._drawShape[keyp].attr('name').split(" ")[1];
                        let layout_side = (this._ctrlDown ? (side == 'left' ? 'right' : 'left' ) : side);
                         this._drawShape[keyp].attr({
                            cx: pos.x + this._layout[bodypart][layout_side][0] * 10,
                            cy: pos.y + this._layout[bodypart][layout_side][1] * 10,
                            visibility: "2"
                        }).css('display', '');

                        let txt = ($(this._drawShape[keyp]).attr("name").includes("left") ? 'L' : 'R');
                        $(this._drawKeypointTexts[keyp]).text(txt);
                    }

                    let xkeypointmargin = -1.5;
                    let ykeypointmargin = 2;

                    $(this._drawKeypointTexts[keyp]).attr({
                        'x': (+$(this._drawShape[keyp]).attr('cx') + xkeypointmargin) * this._playerScale,
                        'y': (+$(this._drawShape[keyp]).attr('cy') + ykeypointmargin) * this._playerScale,
                        'transform' : `scale(${1/this._playerScale})`,
                    });

                    $(this._drawKeypointTexts[keyp]).find('tspan').each(function() {
                        let parent = $(this.parentElement);
                        this.setAttribute('x', parent.attr('x'));
                     });
                }

                var keyp1, keyp2 = null;

                for (conn = 0; conn < this._connections.length; conn++) {

                    for (var i = 0; i < this._drawShape.length; i++) {

                        if ($(this._drawShape[i]).attr("name") ==  this._connections[conn][0]) {
                            keyp1 = $(this._drawShape[i]);
                        }
                        else if ($(this._drawShape[i]).attr("name") ==  this._connections[conn][1]) {
                            keyp2 = $(this._drawShape[i]);
                        };
                    }

                    if (keyp1 && keyp2) {
                        this._drawConnectors[conn].attr({
                            x1: keyp1.attr('cx'),
                            y1: keyp1.attr('cy'),
                            x2: keyp2.attr('cx'),
                            y2: keyp2.attr('cy'),
                            id1: keyp1.attr('name'),
                            id2: keyp2.attr('name')
                        }).css('display', '');
                    }
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

            if(this._ctrlDown){
                this._ctrlDown = false;
            }
            let pos = translateSVGPos(this._frameContent['0'], e.clientX, e.clientY, this._playerScale);
            pos.fixed = true;

            if(this._drawShapeType == 'rect'){
                this._controller.onAddPoint(pos);
            }
            else if (this._drawShapeType == 'skel'){
                this._controller.onAddSkeleton(this._drawShape);
            }
        }

        function ctrlKeyDownHandler(e) {

            var keyCode = e.keyCode || e.which;

             // CtrlKey - flip skeleton
              if (keyCode == 17 && this._drawMode) {

                 this._ctrlDown = !this._ctrlDown;

                 let keyp_names = this._keypoint_names;
                 var bodyparts = [];

                 for(let keyp_name in keyp_names){
                    if(keyp_names[keyp_name].includes('left') || keyp_names[keyp_name].includes('right') && (!bodyparts.includes(keyp_names[keyp_name].split(" ")[1]))) {
                        bodyparts.push(keyp_names[keyp_name].split(" ")[1]);
                    }
                 }
                //Next, iterate over body parts and switch coordinates
                //if are "left" or "right"

                for (var c=0; c < this._drawConnectors.length; c++){

                    if ($(this._drawConnectors[c]).attr('id1').includes('left')) {
                        $(this._drawConnectors[c]).attr('id1', 'right ' + $(this._drawConnectors[c]).attr('id1').split(" ")[1]);
                    } else if ($(this._drawConnectors[c]).attr('id1').includes('right')) {
                        $(this._drawConnectors[c]).attr('id1', 'left ' + $(this._drawConnectors[c]).attr('id1').split(" ")[1]);
                    };

                    if ($(this._drawConnectors[c]).attr('id2').includes('left')) {
                        $(this._drawConnectors[c]).attr('id2', 'right ' + $(this._drawConnectors[c]).attr('id2').split(" ")[1]);
                    } else if ($(this._drawConnectors[c]).attr('id2').includes('right')) {
                        $(this._drawConnectors[c]).attr('id2', 'left ' + $(this._drawConnectors[c]).attr('id2').split(" ")[1]);
                    };
                };

                for(var bodypart =0; bodypart < bodyparts.length; bodypart++) {
                //Switch circle left/right coordinates

                    var switches = {
                        left : null,
                        right : null
                    };

                    for(var c = 0; c < $(this._drawShape).length; c++){

                        // If name is right something or left something
                        if (bodyparts[bodypart] == $(this._drawShape[c]).attr('name').split(" ")[1]){
                            if ($(this._drawShape[c]).attr('name').split(" ")[0] == 'left'){
                                switches.left = c;
                            }
                            else {
                                switches.right = c;
                            }
                        }
                        else {
                            //Don't switch anything around, this is either nose
                            // or center keypoints.
                        }
                    }
                    var tmp_coord = [$(this._drawShape[switches.left]).attr('cx'),
                                     $(this._drawShape[switches.left]).attr('cy')];

                        $(this._drawShape[switches.left]).attr({
                            'cx' : $(this._drawShape[switches.right]).attr('cx'),
                            'cy' : $(this._drawShape[switches.right]).attr('cy')
                        });
                        $(this._drawShape[switches.right]).attr({
                            'cx' : tmp_coord[0],
                            'cy' : tmp_coord[1]
                        });
                    }
                    //e.preventDefault();
              }
        }
    }

    onPlayerUpdate(player) {

        this._playerScale = player.geometry.scale;
        if (this._drawMode) {

            if(this._drawShapeType == 'rect'){
            this._aim.aimX.css({
                'stroke-width': 2 / this._playerScale,
            });
            this._aim.aimY.css({
                'stroke-width': 2  /this._playerScale,
            });
            /*this._drawShape.css({
                'stroke-width': 2 / this._playerScale, /// this._playerScale
            });*/
            }
            else if (this._drawShapeType == 'skel'){

                //TODO: define behavior when we change frames
            }

        }
    }
}
