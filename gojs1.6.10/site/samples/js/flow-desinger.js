function FlowDesigner(diagramDiv) {
    var G = go.GraphObject.make;
    var _this = {};
    var _designer = {};
    var _jsonNewStep = { key: guid(), text: "新步骤", remark: '' };

    /** --------public method----------------------------------------**/
    /**
     * 初始化图例面板
     * @returns {*}
     */
    this.initToolbar = function(div){
        var myPalette =
            G(go.Palette, div, // 必须是DIV元素
                {
                    maxSelectionCount: 3,
                    nodeTemplateMap: _designer.nodeTemplateMap, // 跟设计图共同一套样式模板
                    model: new go.GraphLinksModel([
                        { key: guid(), text: "开始", figure: "Circle", fill: "#4fba4f", stepType: 1 },
                        _jsonNewStep,
                        { key: guid(), text: "结束", figure: "Circle", fill: "#CE0620", stepType: 4 }
                    ])
                });

        return myPalette;
    };

    /**
     * 在设计面板中显示流程图
     * @param flowData  流程图json数据
     */
    this.displayFlow = function (flowData) {

        if(!flowData) return;

        _designer.model = go.Model.fromJson(flowData);

        var pos = _designer.model.modelData.position;
        if (pos) _designer.initialPosition = go.Point.parse(pos);

        // 更改所有连线中间的文本背景色
        setLinkTextBg();
    };

    /**
     * 创建新步骤
     */
    this.createStep = function() {
        var jsonNewStep = {key:_jsonNewStep.key, text:_jsonNewStep.text};
        jsonNewStep.loc = "270 140";// “新步骤”显示的位置
        _designer.model.addNodeData(jsonNewStep);
    };

    /**
     * 获取流程图数据
     * @returns {*}
     */
    this.getFlowData = function () {
        _designer.model.modelData.position = go.Point.stringify(_designer.position);
        return _designer.model.toJson();
    };

    /**
     * 检验流程图是否规范
     */
    this.checkData = function() {
        var errMsg = "";

        // 检查：每个步骤必须包含角色
        if (!_designer.model.nodeDataArray) return '请绘制流程图';

        $.each(_designer.model.nodeDataArray, function(i, item) {
            if (!item.hasOwnProperty("remark") || item.remark === "") {
                errMsg = "请为步骤【" + item.text + "】设置备注~";
                return false;
            }
        });

        return errMsg;
    };

    /** --------public method-------------end---------------------------**/

    init(diagramDiv);

    /** --------private method----------------------------------------**/

    /**
     * 初始化流程设计器
     * @param divId 设计器Div
     */
    function init(divId) {
        _designer = G(go.Diagram, divId, // must name or refer to the DIV HTML element
                {  grid: G(go.Panel, "Grid",
                        G(go.Shape, "LineH", { stroke: "lightgray", strokeWidth: 0.5 }),
                        G(go.Shape, "LineH", { stroke: "gray", strokeWidth: 0.5, interval: 10 }),
                        G(go.Shape, "LineV", { stroke: "lightgray", strokeWidth: 0.5 }),
                        G(go.Shape, "LineV", { stroke: "gray", strokeWidth: 0.5, interval: 10 })
                    ),
                    allowDrop: true, // must be true to accept drops from the Palette
                    allowTextEdit: false,
                    allowHorizontalScroll: false,
                    allowVerticalScroll: false,
                    "clickCreatingTool.archetypeNodeData": _jsonNewStep, // 双击创建新步骤
                    "draggingTool.dragsLink": true,
                    "draggingTool.isGridSnapEnabled": true,
                    "linkingTool.isUnconnectedLinkValid": true,
                    "linkingTool.portGravity": 20,
                    "relinkingTool.isUnconnectedLinkValid": true,
                    "relinkingTool.portGravity": 20,
                    "relinkingTool.fromHandleArchetype":
                        G(go.Shape, "Diamond", { segmentIndex: 0, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "tomato", stroke: "darkred" }),
                    "relinkingTool.toHandleArchetype":
                        G(go.Shape, "Diamond", { segmentIndex: -1, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "darkred", stroke: "tomato" }),
                    "linkReshapingTool.handleArchetype":
                        G(go.Shape, "Diamond", { desiredSize: new go.Size(7, 7), fill: "lightblue", stroke: "deepskyblue" }),
                    "undoManager.isEnabled": true
         });

        // 流程图如果有变动，则提示用户保存
        _designer.addDiagramListener("Modified", onDiagramModified);

        // 双击事件
        _designer.addDiagramListener("ObjectDoubleClicked", onObjectDoubleClicked);

        // 流程步骤的样式模板
        _designer.nodeTemplate = makeNodeTemplate();

        // 流程连接线的样式模板
        _designer.linkTemplate = makeLinkTemplate();

    };

    /**
     * 生成GUID
     * @returns {string}
     */
    function guid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * 步骤图的样式模板
     * @returns {*}
     */
    function makeNodeTemplate(){
        return G(go.Node, "Spot",
            { locationSpot: go.Spot.Center },
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            { selectable: true, selectionAdornmentTemplate: makeNodeSelectionAdornmentTemplate() },
            new go.Binding("angle").makeTwoWay(),
            // the main object is a Panel that surrounds a TextBlock with a Shape
            G(go.Panel, "Auto",
                { name: "PANEL" },
                new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
                G(go.Shape, "RoundedRectangle", // default figure
                    {
                        portId: "", // the default port: if no spot on link data, use closest side
                        fromLinkable: true,
                        toLinkable: true,
                        cursor: "pointer",
                        fill: "#7e7e7f", // 默认背景色
                        strokeWidth: 1,
                        stroke: "#DDDDDD"
                    },
                    new go.Binding("figure"),
                    new go.Binding("fill")),
                G(go.TextBlock,
                    {
                        font: "bold 11pt Helvetica, Arial, sans-serif",
                        margin: 8,
                        maxSize: new go.Size(160, NaN),
                        wrap: go.TextBlock.WrapFit,
                        editable: true,
                        stroke: "white"
                    },
                    new go.Binding("text").makeTwoWay()), // the label shows the node data's text
                {
                    toolTip:// this tooltip Adornment is shared by all nodes
                        G(go.Adornment, "Auto",
                            G(go.Shape, { fill: "#FFFFCC" }),
                            G(go.TextBlock, { margin: 4 }, // the tooltip shows the result of calling nodeInfo(data)
                                new go.Binding("text", "", nodeInfo))
                        ),
                    // 绑定上下文菜单
                    contextMenu: makePartContextMenu()
                }
            ),
            // 4个连接点
            makeNodePort("T", go.Spot.Top, false, true),
            makeNodePort("L", go.Spot.Left, true, true),
            makeNodePort("R", go.Spot.Right, true, true),
            makeNodePort("B", go.Spot.Bottom, true, false),
            {
                mouseEnter: function (e, node) { showNodePort(node, true); },
                mouseLeave: function (e, node) { showNodePort(node, false); }
            }
        );
    }

    /**
     * 选中节点的样式
     * @returns {*}
     */
    function makeNodeSelectionAdornmentTemplate(){
        return G(go.Adornment, "Auto",
            G(go.Shape, { fill: null, stroke: "deepskyblue", strokeWidth: 1.5, strokeDashArray: [4, 2] }),
            G(go.Placeholder)
        );
    }

    /**
     * 创建连接点
     * @param name
     * @param spot
     * @param output
     * @param input
     * @returns {*}
     */
    function makeNodePort(name, spot, output, input) {
        // the port is basically just a small transparent square
        return G(go.Shape, "Circle",
            {
                fill: null, // not seen, by default; set to a translucent gray by showSmallPorts, defined below
                stroke: null,
                desiredSize: new go.Size(7, 7),
                alignment: spot, // align the port on the main Shape
                alignmentFocus: spot, // just inside the Shape
                portId: name, // declare this object to be a "port"
                fromSpot: spot,
                toSpot: spot, // declare where links may connect at this port
                fromLinkable: output,
                toLinkable: input, // declare whether the user may draw links to/from here
                cursor: "pointer" // show a different cursor to indicate potential link point
            });
    };

    /**
     * tooltip上显示的信息
     * @param d
     * @returns {string}
     */
    function nodeInfo(d) {
        return '双击或单击右键可编辑';
    }

    /**
     * 右键菜单
     * @returns {*}
     */
    function makePartContextMenu(){
        return G(go.Adornment, "Vertical",
            makeMenuItem("编辑",
                function(e, obj) { // OBJ is this Button
                    var contextmenu = obj.part; // the Button is in the context menu Adornment
                    var part = contextmenu.adornedPart; // the adornedPart is the Part that the context menu adorns
                    // now can do something with PART, or with its data, or with the Adornment (the context menu)
                    showEditNode(part);
                }),
            makeMenuItem("剪切",
                function(e, obj) { e.diagram.commandHandler.cutSelection(); },
                function(o) { return o.diagram.commandHandler.canCutSelection(); }),
            makeMenuItem("复制",
                function(e, obj) { e.diagram.commandHandler.copySelection(); },
                function(o) { return o.diagram.commandHandler.canCopySelection(); }),
            makeMenuItem("删除",
                function(e, obj) { e.diagram.commandHandler.deleteSelection(); },
                function(o) { return o.diagram.commandHandler.canDeleteSelection(); })
        );
    };

    /**
     * 生成右键菜单项
     * @param text
     * @param action
     * @param visiblePredicate
     * @returns {*}
     */
    function makeMenuItem(text, action, visiblePredicate) {
        return G("ContextMenuButton",
            G(go.TextBlock, text, {
                margin: 5,
                textAlign: "left",
                stroke: "#555555"
            }),
            { click: action },
            // don't bother with binding GraphObject.visible if there's no predicate
            visiblePredicate ? new go.Binding("visible", "", visiblePredicate).ofObject() : {});
    };

    /**
     * 是否显示步骤的连接点
     * @param node
     * @param show
     */
    function showNodePort(node, show) {
        node.ports.each(function (port) {
            if (port.portId !== "") { // don't change the default port, which is the big shape
                port.fill = show ? "rgba(255,0,0,.5)" : null;
            }
        });
    };

    /**
     * 连接线的选中样式
     * @returns {*}
     */
    function makeLinkSelectionAdornmentTemplate(){
        return G(go.Adornment, "Link",
            G(go.Shape,
                // isPanelMain declares that this Shape shares the Link.geometry
                { isPanelMain: true, fill: null, stroke: "deepskyblue", strokeWidth: 0 }) // use selection object's strokeWidth
        );
    };

    /**
     * 定义连接线的样式模板
     * @returns {*}
     */
    function makeLinkTemplate(){
        return G(go.Link, // the whole link panel
            { selectable: true, selectionAdornmentTemplate: makeLinkSelectionAdornmentTemplate() },
            { relinkableFrom: true, relinkableTo: true, reshapable: true },
            {
                routing: go.Link.AvoidsNodes,
                curve: go.Link.JumpOver,
                corner: 5,
                toShortLength: 4
            },
            G(go.Shape, // 线条
                { stroke: "black" }),
            G(go.Shape, // 箭头
                { toArrow: "standard", stroke: null }),
            G(go.Panel, "Auto",
                G(go.Shape, // 标签背景色
                    {
                        fill: null,
                        stroke: null
                    }, new go.Binding("fill", "pFill")),
                G(go.TextBlock, // 标签文本
                    {
                        textAlign: "center",
                        font: "10pt helvetica, arial, sans-serif",
                        stroke: "#555555",
                        margin: 4
                    },
                    new go.Binding("text", "text")), // the label shows the node data's text
                {
                    toolTip:// this tooltip Adornment is shared by all nodes
                        G(go.Adornment, "Auto",
                            G(go.Shape, { fill: "#FFFFCC" }),
                            G(go.TextBlock, { margin: 4 }, // the tooltip shows the result of calling nodeInfo(data)
                                new go.Binding("text", "", nodeInfo))
                        ),
                    // this context menu Adornment is shared by all nodes
                    contextMenu: makePartContextMenu()
                }
            )
        );
    };

    /**
     * 流程图元素的双击事件
     * @param ev
     */
    function onObjectDoubleClicked(ev) {
        var part = ev.subject.part;
        showEditNode(part);
    };

    /**
     * 流程图如果有变动，则提示用户保存
     * @param e
     */
    function onDiagramModified(e){
        var button = document.getElementById("btnSaveFlow");
        if (button) button.disabled = !_designer.isModified;
        var idx = document.title.indexOf("*");
        if (_designer.isModified) {
            if (idx < 0) document.title += "*";
        } else {
            if (idx >= 0) document.title = document.title.substr(0, idx);
        }
    };

    /**
     * 编辑节点信息
     */
    function showEditNode(node) {
        if ((node instanceof go.Node) && node.data.figure === 'Circle') {
            layer.msg("开始和结束步骤不可编辑~");
            return;
        }

        layer.prompt({
            formType: 3,
            value: node.data.text,
            title: '编辑步骤'
        }, function(value, index, elem){
            updateNodeData(node,value);
            layer.close(index);
        });
    }

    /**
     * 更新节点信息
     * @param oldData
     * @param newData
     */
    function updateNodeData(node, text) {
        _designer.startTransaction("vacate");
        _designer.model.setDataProperty(node.data, "text", text);
        _designer.commitTransaction("vacate");
    };

    /**
     * 更改所有连线中间的文本背景色
     */
    function setLinkTextBg() {
        _designer.links.each(function (link) {
            _designer.startTransaction("vacate");
            if (link.data.text) {
                _designer.model.setDataProperty(link.data, "pFill", window.go.GraphObject.make(go.Brush, "Radial", {
                    0: "rgb(240, 240, 240)",
                    0.3: "rgb(240, 240, 240)",
                    1: "rgba(240, 240, 240, 0)"
                }));
            }
            _designer.commitTransaction("vacate");
        });
    };

    /** --------private method------------------end----------------------**/

    return this;
};
