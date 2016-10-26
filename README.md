# FlowDiagram
基于GOJS封装的流程图设计（展示）工具类，主要分为两个工具类：
>工具库依赖于go.js、jquery以及layer.js
>- http://gojs.net/
>- http://jquery.com/
>- http://layer.layui.com/

###希望支持FlowDiagram的童鞋能够到Github给我们一个star^_^
https://github.com/mengmakies/FlowDiagram

<img src="http://git.oschina.net/markies/FlowDiagram/raw/master/gojs1.6.10/screenshot/flow-designer.png" width = "500px" height = "auto" alt="图片名称" align=center />  &nbsp;
<img src="http://git.oschina.net/markies/FlowDiagram/raw/master/gojs1.6.10/screenshot/flow-display.png" width = "500px" height = "auto" alt="图片名称" align=center />

##流程图数据
```
{ "class": "go.GraphLinksModel",
  "modelData": {"position":"-5 -5"},
  "nodeDataArray": [
{"key":"1", "text":"开始", "figure":"Circle", "fill":"#4fba4f", "stepType":1, "loc":"90 110"},
{"key":"2", "text":"结束", "figure":"Circle", "fill":"#CE0620", "stepType":4, "loc":"770 110"},
{"key":"3", "text":"填写请假信息 ",  "loc":"210 110", "remark":""},
{"key":"4", "text":"部门经理审核 ",  "loc":"370 110", "remark":""},
{"key":"5", "text":"人事审核  ",  "loc":"640 110", "remark":""},
{"key":"6", "text":"副总经理审核  ",  "loc":"510 40", "remark":""},
{"key":"7", "text":"总经理审核  ",  "loc":"500 180", "remark":""}
 ],
  "linkDataArray": [
{"from":"1", "to":"3"},
{"from":"3", "to":"4"},
{"from":"4", "to":"5"},
{"from":"5", "to":"2"},
{"from":"4", "to":"6", "key":"1001", "text":"小于5天 ", "remark":"", "condition":"Days<5"},
{"from":"6", "to":"5"},
{"from":"4", "to":"7", "key":"1002", "text":"大于5天 ", "remark":"", "condition":"Days>5"},
{"from":"7", "to":"5"}
 ]}
```

## 1.流程图设计  flow-desinger.js
```javascript
    var areaFlow = document.getElementById('mySavedModel');

    var  myDesigner= new FlowDesigner('myFlowDesignerDiv');// 流程图设计器
    myDesigner.initToolbar('myPaletteDiv');// 初始化控件面板
    myDesigner.displayFlow(areaFlow.value);// 在设计面板中显示流程图
```

## 2.流程图展示 flow-display.js
```javascript
    var areaFlow = document.getElementById('mySavedModel');

    var myDisplay = new FlowDisplay('myDisplayDiv');// 流程图显示器
    
    var flowPath = '3,4,6,5';// 3,4,6,5是步骤的id，最后一个步骤为"待处理"或"已完成"的步骤
    var isCompleted = false;// "待处理"或"已结束"
    myDisplay.loadFlow(areaFlow.value);// 显示流程图
    myDisplay.animateFlowPath(flowPath, isCompleted);// 动画显示流程路径
```
>
详细代码请参考目录下的html文件：
**/gojs1.6.10/site/samples/_demo.html**
http://git.oschina.net/markies/FlowDiagram/raw/master/gojs1.6.10/site/samples/_demo.html
