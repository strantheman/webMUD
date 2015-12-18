function inGameTopPlayers(){
	var match,
	pl = /\+/g,  // Regex for replacing addition symbol with a space
	search = /([^&=]+)=?([^&]*)/g,
	decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
	query = window.location.search.substring(1);

	urlParams = {};
	while (match = search.exec(query))
		urlParams[decode(match[1])] = decode(match[2]);
	var url = '/Realms/TopPlayers?RealmID=' + urlParams.realmID;
	window.open(url, 'newwindow', 'width=500, height=750');
};

//just wrote a check for percent being above 100%
function updateHPMABars() {
	// altered this
	hpPercent = Math.floor(curHP * 100 / maxHP);
	$("#hp").html(String(curHP) + " / " + String(maxHP));
	if (maxMA > 0) {
		maPercent = Math.floor(curMA * 100 / maxMA);
		$("#ma").html(String(curMA) + " / " + String(maxMA));
	} else {
		$("#maContainer").hide();
	}
	$('.progress-bar span').each(function () {
		if($(this).attr("id") == "hp"){
			if(hpPercent > 100){
				$(this).parent().css("width","100%");
			} else {
				$(this).parent().css("width",String(hpPercent) + "%");
			}
		} else if ($(this).attr("id") == "ma"){
			if(maPercent > 100){
				$(this).parent().css("width","100%");
			} else {
				$(this).parent().css("width",String(maPercent) + "%");
			}
		}
	});
}

//updates the EXP bar
function updateEXPBar() {
	var exp =  $("#exp");
	expPercent = Math.floor(curEXP * 100 / nextEXP);
	$(exp).html(String(nextEXP-curEXP));
	if(expPercent > 100){
		$(exp).parent().css("width","100%");
	} else {
		$(exp).parent().css("width",String(expPercent) + "%");
	}
}

//sets the curEXP and nextEXP variables and updates the bar (slight modification to yours).
function exp(actionData) {
	// altered this
	curEXP = actionData.Exp;
	nextEXP = actionData.TotalExpForNextLevel;
	updateEXPBar();
	var extraExpNeeded = nextEXP - curEXP;
	if (extraExpNeeded < 0) {
		extraExpNeeded = 0;
	}
	var text = buildSpan(cga_dark_green, "Exp: ") + buildSpan(cga_dark_cyan, String(actionData.Exp)) + buildSpan(cga_dark_green, " Level: ") + buildSpan(cga_dark_cyan, String(actionData.Level)) + buildSpan(cga_dark_green, " Exp needed for next level: ") + buildSpan(cga_dark_cyan, String(extraExpNeeded) + " (" + String(actionData.TotalExpForNextLevel) + ") [" + expPercent + "%]") + "<br>";
	addMessageRaw(text, false, true);
}

//added addition to get experience. update the expbar and add the exp earned to curEXP
function combatRound(actionData) {
	var text = "";
	var attackerName;
	var verbNumber;
	if (actionData.AttackerID != playerID) {
		if (actionData.AttackerTypeID === 0) {
			attackerName = actionData.AttackerName;
		} else {
			attackerName = "The " + actionData.AttackerName;
		}
		isOrAre = "";
		verbNumber = 1;
	} else {
		attackerName = "You";
		verbNumber = 0;
	}
	var targetName;
	if (actionData.TargetID != playerID) {
		targetName = actionData.TargetName;
	} else {
		targetName = "you";
	}
	for (var i = 0; i < actionData.SwingInfos.length; i++) {
		switch (actionData.SwingInfos[i].SwingResult) {
		case 1: //hit
		case 2: //crit
			text += buildSpan(cga_light_red, attackerName + " " + (actionData.SwingInfos[i].SwingResult == 2 ? "critically " : "") + actionData.SwingInfos[i].Verbs[verbNumber] + " " + targetName + " for " + String(actionData.SwingInfos[i].Damage) + "!") + "<br>";
			if (actionData.SwingInfos[i].SwingConsequences && actionData.SwingInfos[i].SwingConsequences.length > 0) {
				for (var j = 0; j < actionData.SwingInfos[i].SwingConsequences.length; j++) {
					switch (actionData.SwingInfos[i].SwingConsequences[j].ConsequenceType) {
					case 0: //drop to ground
						var dropText = (actionData.TargetID != playerID ? "drops" : "drop");
						text += buildSpan(cga_light_red, capitalizeFirstLetter(targetName) + " " + dropText + " to the ground!") + "<br>";
						break;
					case 1: //death
						if (actionData.SwingInfos[i].SwingConsequences[j].RIPFigureType == 1) {
							text += buildSpan(cga_light_grayHex, actionData.SwingInfos[i].SwingConsequences[j].DeathMessage) + "<br>";
						} else {
							var isOrAreText = (actionData.TargetID != playerID ? "is" : "are");
							text += buildSpan(cga_light_red, capitalizeFirstLetter(targetName) + " " + isOrAreText + " dead!") + "<br>";
						}
						break;
					case 3: //gain experience
						for (var k = 0; k < actionData.SwingInfos[i].SwingConsequences[j].KillerPlayerIDs.length; k++) {
							if (actionData.SwingInfos[i].SwingConsequences[j].KillerPlayerIDs[k] == playerID) {
								text += buildSpan(cga_light_grayHex, "You gain " + String(actionData.SwingInfos[i].SwingConsequences[j].ExpEach) + " experience.") + "<br>";
							}
						}
						// added this
						ExpGained +=  +String(actionData.SwingInfos[i].SwingConsequences[j].ExpEach);
						curEXP += actionData.SwingInfos[i].SwingConsequences[j].ExpEach;
						updateEXPBar();				
						break;
					case 5: //cashDrop
						for (var k = 0; k < actionData.SwingInfos[i].SwingConsequences[j].DroppedCoinRolls.length; k++) {
							text += buildSpan(cga_light_grayHex, String(actionData.SwingInfos[i].SwingConsequences[j].DroppedCoinRolls[k].NumberCoins) + " " + (actionData.SwingInfos[i].SwingConsequences[j].DroppedCoinRolls[k].NumberCoins > 1 ? pluralCoinName(actionData.SwingInfos[i].SwingConsequences[j].DroppedCoinRolls[k].CoinTypeID) + " drop" : singleCoinName(actionData.SwingInfos[i].SwingConsequences[j].DroppedCoinRolls[k].CoinTypeID) + " drops") + " to the ground.") + "<br>";
						}
						break;
					default:
						break;
					}
				}
			}
			break;
		case 0: //miss
			text += buildSpan(cga_dark_cyan, attackerName + " " + actionData.SwingInfos[i].Verbs[verbNumber] + " at " + targetName + "!") + "<br>";
			break;
		case 3: //dodge
			var dodgeText;
			if (targetName == "you") {
				dodgeText = "you dodge";
			} else {
				dodgeText = "they dodge";
			}
			text += buildSpan(cga_dark_cyan, attackerName + " " + actionData.SwingInfos[i].Verbs[verbNumber] + " at " + targetName + ", but " + dodgeText + " out of the way!") + "<br>";
			break;
		case 4: //glance
			text += buildSpan(cga_light_red, attackerName + " " + actionData.SwingInfos[i].Verbs[verbNumber] + " " + targetName + ", but the swing glances off!") + "<br>";
			break;
		}
	}
	addMessageRaw(text, false, true);
}

//makes the direction buttons work
function MoveClick(moveValue){
	var movementValue = moveValue;
	sendMessageText(movementValue);
	$('#message').val('').focus();
};

//beginning of map screen I believe this will have to occur back of house.
function openMapScreen() {
	if($("#mapScreen").length){
		$("#mapScreen").toggle();
	} else if($("#toolsDiv").length){
		$('<div id="mapScreen" style="float:left; width:100%;"><span style="display:block; text-align:center">Map</span><div>').insertAfter("#toolsDiv");
	} else {
		$('<div id="mapScreen" style="float:left; width:100%;"><span style="display:block; text-align:center">Map</span><div>').insertAfter("#progressMonitors");
	}

}

//this searches through the mainScreen and finds and adds gossip messages (needs to either run on a timer or watch mainScreen for changes). Telepaths etc to be added later. Currently in a refresh button.
//probably have to capture the current contents, with time of addition then somehow compare then update. Currently these all have the same current time added. 
function RefreshBackScroll(){
	checkGossips();
	checkTelepaths();
	checkSpeak();
	checkYell();
	checkBroadcast();

	backscrollToBottom();
}

//toggle display of the back scroll div
function BackScrollToggle(){
	$("#backScrollDiv").toggle($("#backScroll").checked);
}

function backscrollToBottom(){
	if($("#backscrollToBottom").is(":checked")){
		// 1E10 is just an arbitrary really large number
		$("#backScrollDiv").scrollTop(1E10);
	}
}

//check gossips
function checkGossips(){
	$("#mainScreen").find("span:contains('gossip')").each(function () {
		var self = this;
		var back = $("#backScrollDiv").find("span:contains('gossip')");
		var contains = false;
		if(back.length){
			$(back).each(function () {
				if(($(this).next().text() == $(self).next().text())){
					contains = true;	
				}
			});
			if(contains === false && $(self).next().attr("style") == "color:#ff55ff" ) {
				$("#backScrollDiv").append(currentTime()).append($(self).clone()).append($(self).next().clone()).append("<br>");

			}
		} else if($(self).next().attr("style") == "color:#ff55ff" ) {
			$("#backScrollDiv").append(currentTime()).append($(self).clone()).append($(self).next().clone()).append("<br>");
		}
	});	
}

//for future implementation of checking for telepaths
function checkTelepaths(){
	// check for me telepathing others?

	// check for others telepathing me
	$("#mainScreen").find("span:contains('telepaths')").each(function () {
		var self = this;
		var back = $("#backScrollDiv").find("span:contains('telepaths')");
		var contains = false;
		if(back.length){
			$(back).each(function () {
				if( $(self).attr("style") == "color:#00aa00" && ($(this).next().text() == $(self).next().text()) && $(self).next().attr("style") == "color:#aaaaaa"){
					contains = true;	
				}
			});
			if(contains === false && $(self).next().attr("style") == "color:#aaaaaa" && $(self).attr("style") == "color:#00aa00" ) {
				$("#backScrollDiv").append(currentTime()).append($(self).clone()).append($(self).next().clone()).append("<br>");

			}
		} else if( $(self).attr("style") == "color:#00aa00" && $(self).next().attr("style") == "color:#aaaaaa" ) {
			$("#backScrollDiv").append(currentTime()).append($(self).clone()).append($(self).next().clone()).append("<br>");
		}
	});	
}

//for future implementation of checking for speaking in room
function checkSpeak(){
	// check for me speaking
	$("#mainScreen").find("span:contains('You say')").each(function () {
		var self = this;
		var back = $("#backScrollDiv").find("span:contains('You say')");
		var contains = false;
		if(back.length){
			$(back).each(function () {
				if( $(self).attr("style") == "color:#00aa00" && $(self).text() == $(this).text()){
					contains = true;	
				}
			});
			if(contains === false && $(self).attr("style") == "color:#00aa00" ) {
				$("#backScrollDiv").append(currentTime()).append($(self).clone()).append("<br>");

			}
		} else if( $(self).attr("style") == "color:#00aa00" ) {
			$("#backScrollDiv").append(currentTime()).append($(self).clone()).append("<br>");
		}
	});

	// check for other's speaking
	$("#mainScreen").find("span:contains(' says ')").each(function () {
		var self = this;
		var back = $("#backScrollDiv").find("span:contains(' says ')");
		var contains = false;
		if(back.length){
			$(back).each(function () {
				if( $(self).attr("style") == "color:#00aa00" && $(self).text() == $(this).text()){
					contains = true;	
				}
			});
			if(contains === false && $(self).attr("style") == "color:#00aa00" ) {
				$("#backScrollDiv").append(currentTime()).append($(self).clone()).append("<br>");

			}
		} else if( $(self).attr("style") == "color:#00aa00" ) {
			$("#backScrollDiv").append(currentTime()).append($(self).clone()).append("<br>");
		}
	});
}

//for future implementation of checking for yelling
function checkYell(){
	// check for me yelling
	$("#mainScreen").find("span:contains('You yell ')").each(function () {
		var self = this;
		var back = $("#backScrollDiv").find("span:contains('You yell ')");
		var contains = false;
		if(back.length){
			$(back).each(function () {
				if( $(self).attr("style") == "color:#00aa00" && $(self).text() == $(this).text()){
					contains = true;	
				}
			});
			if(contains === false && $(self).attr("style") == "color:#00aa00" ) {
				$("#backScrollDiv").append(currentTime()).append($(self).clone()).append("<br>");

			}
		} else if( $(self).attr("style") == "color:#00aa00" ) {
			$("#backScrollDiv").append(currentTime()).append($(self).clone()).append("<br>");
		}
	});

	// check for other's yelling
	$("#mainScreen").find("span:contains('Someone yells')").each(function () {
		var self = this;
		var back = $("#backScrollDiv").find("span:contains('Someone yells')");
		var contains = false;
		if(back.length){
			$(back).each(function () {
				if( $(self).attr("style") == "color:#00aa00" && $(self).text() == $(this).text()){
					contains = true;	
				}
			});
			if(contains === false && $(self).attr("style") == "color:#00aa00" ) {
				$("#backScrollDiv").append(currentTime()).append($(self).clone()).append("<br>");

			}
		} else if( $(self).attr("style") === "color:#00aa00" ) {
			$("#backScrollDiv").append(currentTime()).append($(self).clone()).append("<br>");
		}
	});
}

//for future implemementation of checking for broadcasts
function checkBroadcast(){
	$("#mainScreen").find("span:contains('Broadcast from')").each(function () {
		var self = this;
		var back = $("#backScrollDiv").find("span:contains('Broadcast from')");
		var contains = false;
		if(back.length){
			$(back).each(function () {
				if( $(self).attr("style") == "color:#FFFF00" && $(self).text() == $(this).text()){
					contains = true;	
				}
			});
			if(contains === false && $(self).attr("style") == "color:#FFFF00" ) {
				$("#backScrollDiv").append(currentTime()).append($(self).clone()).append("<br>");

			}
		} else if( $(self).attr("style") == "color:#FFFF00" ) {
			$("#backScrollDiv").append(currentTime()).append($(self).clone()).append("<br>");
		}
	});

};


//for future implementation of checking for telling
function checkTelling(){
	// check for me telling

	// check for other's telling
	$("#mainScreen").find("span:contains('says (to')").each(function () {
		var self = this;
		var back = $("#backScrollDiv").find("span:contains('says (to')");
		var contains = false;
		if(back.length){
			$(back).each(function () {
				if( $(self).attr("style") == "color:#00aa00" && $(self).text() == $(this).text()){
					contains = true;	
				}
			});
			if(contains == false && $(self).attr("style") == "color:#00aa00" ) {
				$("#backScrollDiv").append(currentTime()).append($(self).clone()).append("<br>");

			}
		} else if( $(self).attr("style") == "color:#00aa00" ) {
			$("#backScrollDiv").append(currentTime()).append($(self).clone()).append("<br>");
		}
	});

}

//should clear backscroll and continue
function ClearBackScroll(){
	$("#backScrollDiv").children().remove();
	//toggle visability off and on
	BackScrollToggle();
	BackScrollToggle();
};

//format current time for adding to front of gossips - set to dd/mm//yyyy
var currentTime = function(){
	var d = new Date();
	var myDate = d.getDate() + "/" + d.getMonth()+ "/" + d.getFullYear(); 
	var time = d.toLocaleTimeString().toLowerCase().replace(/([\d]+:[\d]+):[\d]+(\s\w+)/g, "$1$2");

	return ("<span><" + myDate + " - " + time + "> </span>");
};

function ResetExpPH(){
	ExpGained = 0;
	TimeElapsed = 0;
	EPH = 0;
	start = new Date().getTime();
	time = 0;
	elapsed = '0.0';
}

//stores the exp details
var curEXP = 0;
var nextEXP = 0;
var expPercent = 0;
var hpPercent = 0;
var maPercent = 0;
var EPH = 0;
var TimeElapsed = 0;
var ExpGained = 0;
var start = new Date().getTime();
var time = 0;
var elapsed = '0.0';
var items = "";

//register on click function that either toggles the display of the tools or adds the new divs and checkboxes etc
function ToolsButton(){
	if($("#toolsDiv").length){
		$("#toolsDiv").toggle();
	} else {
		$('<br><div id="toolsDiv" style="float:left; width:100%;"><span style="display:block; text-align:center;">------------ Tools -----------</span><br><input type="checkbox" id="backScroll" value="backscroll" onclick="BackScrollToggle()" /><span> Chat Back-Scroll</span>&nbsp&nbsp<input type="button" id="clearBackScroll" value="Clear" onclick="ClearBackScroll()" style="width:5em; height:2em; padding:0;" class="btn" />&nbsp<input type="checkbox" value="backscrollToBottom" id="backscrollToBottom" /><span> Scroll to Bottom</span><br><div id="backScrollDiv" style="resize:both; font-family: Courier New, Courier, monospace; font-size: medium; float: left; width:800px; height: 200px; margin: 5px; background-color: black; color: white; overflow-y: scroll; display: none;"></div></div>').insertAfter("#progressMonitors");
	}
}

//Run to places
function RunToBrigandFromTown(){
	var toBrigand = "ne,ne,ne,e,se,e,e,ne,ne,ne,nw,nw,n,ne,ne,n,nw,n,nw,w,nw,n,ne,n,ne,e,se,ne,nw,ne,e,se,e,se,e,ne,e";  
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	toBrigand.split(",").forEach(function(direction){
		MoveClick(direction);
	});
	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");
}

function RunToTownFromBrigand(){
	var toTown = "w,sw,w,nw,w,nw,w,sw,se,sw,nw,w,sw,s,sw,s,se,e,se,s,se,s,sw,sw,s,se,se,sw,sw,sw,w,w,nw,w,sw,sw,sw";
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	toTown.split(",").forEach(function(direction){
		MoveClick(direction);
	});
	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");

}

function RunToTownFromTanglewood(){
	var toTown = "s,se,ne,e,u,e,e,ne,ne,ne,e,ne,e,ne,e,se,e,ne,n,nw,n,ne,ne,ne,n,e,ne,ne,n,ne,ne,e,ne,se,se,e,se,se,sw,sw,sw";

	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	toTown.split(",").forEach(function(direction){
		MoveClick(direction);
	});
	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");

}

function RunToTanglewoodFromTown(){
	var toTanglewood = "ne,ne,ne,nw,nw,w,nw,nw,sw,w,sw,sw,s,sw,sw,w,s,sw,sw,sw,s,se,s,sw,w,nw,w,sw,w,sw,w,sw,sw,sw,w,w,d";

	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	toTanglewood.split(",").forEach(function(direction){
		MoveClick(direction);
	});
	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");

}

function RunToTownFromWolves(){
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	var toTown = "e,ne,e,se,e,se,s,sw,w,sw,s,sw,se,s,se,s,sw,se,s,sw,se,s,se,se,sw,sw,sw";
	toTown.split(",").forEach(function (direction){
		MoveClick(direction);
	});

	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");
}

function RunToWolvesFromTown(){
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	var toWolves = "ne,ne,ne,nw,nw,n,nw,ne,n,nw,ne,n,nw,n,nw,ne,n,ne,e,ne,n,nw,w,nw,w,sw,w";
	toWolves.split(",").forEach(function (direction){
		MoveClick(direction);
	});

	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");

}

function RunToTownFromVerdantBog(){
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	var toTown = "s,se,sw,s,sw,nw,n,n,nw,n,n,nw,n,n,n,nw,n,ne,n,ne,ne,n,n,ne,n,n,nw,w,nw,n,ne,n,n,n,n,ne,n,nw,w,nw,w,nw,w,n,nw,n,nw,n,nw,sw,n,nw,n,nw,ne,n,nw,n,n,n,nw,sw,sw,sw,w,w,nw,w,sw,sw,sw";
	toTown.split(",").forEach(function(direction){
		MoveClick(direction);
	});

	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");
}

function RunToVerdantBogFromTown(){
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	var toTown = "s,se,sw,s,sw,nw,n,n,nw,n,n,nw,n,n,n,nw,n,ne,n,ne,ne,n,n,ne,n,n,nw,w,nw,n,ne,n,n,n,n,ne,n,nw,w,nw,w,nw,w,n,nw,n,nw,n,nw,sw,n,nw,n,nw,ne,n,nw,n,n,n,nw,sw,sw,sw,w,w,nw,w,sw,sw,sw";
	toTown.split(",").reverse().forEach(function(direction){
		MoveClick(reverseDirection(direction));
	});

	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");
}

function RunToGreenmarshesFromSouthport(){
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	var toGreenmarshes = "w,w,w,w,w,w,w,w,w,w,w,w,w,w,n,n,n,n,n,n,n,n,n,n,n,n,n,n,n,n,nw,nw,nw,n,w,w,nw,nw,n,n,n,n,ne,n,ne,n,d,nw,n,e,ne,d,ne,ne,n,n,ne,n,ne,n,ne,se,e";
	toGreenmarshes.split(",").forEach(function(direction){
		MoveClick(direction);
	});

	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");
}

function RunToSouthportFromGreenmarshes(){
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	var toGreenmarshes = "w,w,w,w,w,w,w,w,w,w,w,w,w,w,n,n,n,n,n,n,n,n,n,n,n,n,n,n,n,n,nw,nw,nw,n,w,w,nw,nw,n,n,n,n,ne,n,ne,n,d,nw,n,e,ne,d,ne,ne,n,n,ne,n,ne,n,ne,se,e";
	toGreenmarshes.split(",").reverse().forEach(function(direction){
		MoveClick(reverseDirection(direction));
	});

	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");
}

function RunToGreenmarshesFromVerdantBog(){
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	var toGreenmarshes = "s,se,sw,s,sw,se,se,s,s,sw,sw,s,w,s,sw,w,sw,nw,w,sw,w,sw,w,nw,sw,w,nw,sw,w,nw,sw,s,sw,sw,s,sw,s,se,e";
	toGreenmarshes.split(",").forEach(function(direction){
		MoveClick(direction);
	});

	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");	
}

function RunToVerdantBogFromGreenmarshes(){
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	var toGreenmarshes = "s,se,sw,s,sw,se,se,s,s,sw,sw,s,w,s,sw,w,sw,nw,w,sw,w,sw,w,nw,sw,w,nw,sw,w,nw,sw,s,sw,sw,s,sw,s,se,e";
	toGreenmarshes.split(",").reverse().forEach(function(direction){
		MoveClick(reverseDirection(direction));
	});

	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");
}

function RunToSivsFromGreenmarshes(){
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	var toSivs = "se,e,n,e,ne,se,se,sw,s,sw,w,sw,s,w,nw,w,nw,";
	toSivs.split(",").forEach(function(direction){
		MoveClick(direction);
	});

	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");
}

function RunToGreenmarshesFromSivs(){
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	var toSivs = "se,e,n,e,ne,se,se,sw,s,sw,w,sw,s,w,nw,w,nw,";
	toSivs.split(",").reverse().forEach(function(direction){
		MoveClick(reverseDirection(direction));
	});

	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");
}

function RunToSivsFromSouthport(){
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	RunToGreenmarshesFromSouthport();
	RunToSivsFromGreenmarshes();

	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");
}

function RunToSouthportFromSivs(){
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	RunToGreenmarshesFromSivs();
	RunToSouthportFromGreenmarshes();

	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");	
}

function RunToSivsFromTown(){
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	RunToVerdantBogFromTown();
	RunToGreenmarshesFromVerdantBog();
	RunToSivsFromGreenmarshes();

	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");
}

function RunToSouthportFromTown(){
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	RunToVerdantBogFromTown();
	RunToGreenmarshesFromVerdantBog();
	RunToSouthportFromGreenmarshes();

	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");
}

function RunToTownFromSouthport(){
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	RunToGreenmarshesFromSouthport();
	RunToVerdantBogFromGreenmarshes();
	RunToTownFromVerdantBog();

	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");
}

function RunToFordCrossingFromVerdantBog(){
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	var toCrossroads = "s,se,sw,s,sw,se,se,s,s"; 
	toCrossroads.split(",").forEach(function(direction){
		MoveClick(direction);
	});
	
	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");
}

function RunToTreasureFromFordCrossing(){
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	var toTreasure = "e,e,se,s,sw,s,s,sw,s,s,s,s,sw,s,se,se,e,se,e,se,se,e,se,ne,e,ne,n,se,e,ne,n,ne,n,ne,n,ne,n,d,e,se,se,d,e,e,e,e,e,n,e,n,d,se,e,e,d,n,w,s"; 
	toTreasure.split(",").forEach(function(direction){
		MoveClick(direction);
	});
	
	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");
}

function RunToFordCrossingFromTreasure(){
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	var toTreasure = "e,e,se,s,sw,s,s,sw,s,s,s,s,sw,s,se,se,e,se,e,se,se,e,se,ne,e,ne,n,se,e,ne,n,ne,n,ne,n,ne,n,d,e,se,se,d,e,e,e,e,e,n,e,n,d,se,e,e,d,n,w,s"; 
	toTreasure.split(",").reverse().forEach(function(direction){
		MoveClick(reverseDirection(direction));
	});
	
	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");
}

function RunToVerdantBogFromFordCrossing(){
	$('#chkEnableAI').prop( "checked", false );
	sendMessageDirect("DisableAI");

	var toCrossroads = "s,se,sw,s,sw,se,se,s,s"; 
	toCrossroads.split(",").reverse().forEach(function(direction){
		MoveClick(reverseDirection(direction));
	});
	
	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");
}

//**********************************

//* Auto Path Menu by Chupon. v0.1 * 
//**********************************

//Paste in your browser's debug console and press enter to add this function to WebMUD



//Thanks @ Blorgen for assistance.



//Simply Add a new case and path in the same format as below.

//Name the case '#Startroom2Finishroom' to make it easier to follow.

//Modify the #Menu alert message to display the new path command you add. 

//And: Type #Menu for a list of paths to pop-up.

//Code is a bit sloppy. but hey... It works!



$(function () {

	$("#message").bind('input', function() {
		var PathTriggerCmd = ($("#message").val());

		switch (PathTriggerCmd) { 
		case '#Menu': 
			$('#message').val("");
			var menu = "Available Paths = #Town2Wolves, #Wolves2Town, #Town2VerdantBog, #VerdantBog2Town";
			if (conversationWindow != null) {
				conversationWindow.addComm(getConversationDateString(), "the system", 3, null, menu);
			}
			break;
		case '#Town2Wolves': 
			$('#message').val("");
			RunToWolvesFromTown();
			break;
		case '#Wolves2Town': 
			$('#message').val("");
			RunToTownFromWolves();
			break;
		case '#Town2VerdantBog': 
			$('#message').val("");
			RunToVerdantBogFromTown();
			break;

		case '#VerdantBog2Town': 
			$('#message').val("");
			RunToTownFromVerdantBog();
			break;
		}
	});
});


//if the window is open do not re-open, bring focus (do this because Telepaths get lost when re-opening)
//tested to work on Safari and Chrome on Mac OSX 10.11.1
var openConvo = function() {
	if(conversationWindow !== null && !conversationWindow.closed){
		conversationWindow.blur();
		conversationWindow.focus();
	} else {
		conversationWindow = window.open(conversationsURL, 'conversation' + playerID, 'width=600, height=750');
	}
	window.onbeforeunload = function (e) {
		conversationWindow.close();
	};
	return false;
}

function reverseDirection(dir){
	var newDir = "";
	for(var i = 0; i < dir.length; i++){
		switch(dir[i]){
		case "n":
			newDir += "s";
			break;
		case "s":
			newDir += "n";
			break;
		case "e":
			newDir += "w";
			break;
		case "w":
			newDir += "e";
			break;
		case "d":
			newDir += "u";
			break;
		case "u":
			newDir += "d";
			break;
		}
	}
	return newDir;
}

function listCommand(actionData) {
	if (actionData.InShop == false) {
		var text = buildSpan(cga_light_red, "You cannot LIST if you are not in a shop!") + "<br>";
		addMessageRaw(text, false, true);
		return;
	}
	var text = buildSpan(cga_light_grayHex, "The following items are for sale here:") + "<br><br>";
	text += buildFormattedSpan(cga_dark_green, "Item", 30, true) + buildFormattedSpan(cga_dark_cyan, "Quantity", 12, true) + buildSpan(cga_dark_cyan, "Price") + "<br>";
	text += buildSpan(cga_dark_cyan, "------------------------------------------------------") + "<br>";

	if (actionData.ItemsForSale && actionData.ItemsForSale.length > 0) {
		for (var i = 0; i < actionData.ItemsForSale.length; i++) {
			if (actionData.ItemsForSale[i].Price % 1000000 === 0 && actionData.ItemsForSale[i].Price != 0){
				text += buildFormattedSpan(cga_dark_green, actionData.ItemsForSale[i].ItemTypeName + " ", 30, true) + buildFormattedSpan(cga_dark_cyan, String(actionData.ItemsForSale[i].Count) + " ", 5, true) + buildFormattedSpan(cga_dark_cyan, String(actionData.ItemsForSale[i].Price / 1000000) + " ", 10, false) + buildSpan(cga_dark_cyan, "runic coins") + "<br>";
			} else if (actionData.ItemsForSale[i].Price % 10000 === 0 && actionData.ItemsForSale[i].Price != 0){
				text += buildFormattedSpan(cga_dark_green, actionData.ItemsForSale[i].ItemTypeName + " ", 30, true) + buildFormattedSpan(cga_dark_cyan, String(actionData.ItemsForSale[i].Count) + " ", 5, true) + buildFormattedSpan(cga_dark_cyan, String(actionData.ItemsForSale[i].Price / 10000) + " ", 10, false) + buildSpan(cga_dark_cyan, "platinum pieces") + "<br>";
			} else if (actionData.ItemsForSale[i].Price % 1000 === 0 && actionData.ItemsForSale[i].Price != 0) {
				text += buildFormattedSpan(cga_dark_green, actionData.ItemsForSale[i].ItemTypeName + " ", 30, true) + buildFormattedSpan(cga_dark_cyan, String(actionData.ItemsForSale[i].Count) + " ", 5, true) + buildFormattedSpan(cga_dark_cyan, String(actionData.ItemsForSale[i].Price / 1000) + " ", 10, false) + buildSpan(cga_dark_cyan, "gold crowns") + "<br>";
			} else if(actionData.ItemsForSale[i].Price % 10 === 0 && actionData.ItemsForSale[i].Price != 0) {
				text += buildFormattedSpan(cga_dark_green, actionData.ItemsForSale[i].ItemTypeName + " ", 30, true) + buildFormattedSpan(cga_dark_cyan, String(actionData.ItemsForSale[i].Count) + " ", 5, true) + buildFormattedSpan(cga_dark_cyan, String(actionData.ItemsForSale[i].Price / 10) + " ", 10, false) + buildSpan(cga_dark_cyan, "silver nobles") + "<br>";
			} else {
				text += buildFormattedSpan(cga_dark_green, actionData.ItemsForSale[i].ItemTypeName + " ", 30, true) + buildFormattedSpan(cga_dark_cyan, String(actionData.ItemsForSale[i].Count) + " ", 5, true) + buildFormattedSpan(cga_dark_cyan, String(actionData.ItemsForSale[i].Price) + " ", 10, false) + buildSpan(cga_dark_cyan, "copper farthings") + "<br>";
			}
		}
	}
	addMessageRaw(text, false, true);
}

var returnTimer = setInterval(function(){
	var val = $("#message").val();
	sendMessageDirect("");
	$("#message").val(val);
},20000);

function instance()
{
	time += 100;

	elapsed = Math.floor(time / 100) / 10;
	if(Math.round(elapsed) == elapsed) { elapsed += '.0'; }	

	TimeElapsed = elapsed / 60;
	var hoursTilLevel = nextEXP - curEXP;

	if(TimeElapsed >= .01){
		// var calculateEXP = curEXP - ExpGained;
		var hours = TimeElapsed / 60;
		EPH = ExpGained / hours;
		var round = Math.round;		
		var result = round((round(EPH) / 1000));
		if(result > 0){
			$("#ExpPerHour").text(result + "k Exp/h | Approx. " + round((hoursTilLevel / (result * 1000)))  + " hours to level")
		}
		else{
			$("#ExpPerHour").text(round(EPH) + " Exp/h | Approx. " + round((hoursTilLevel / EPH))  + " hours to level")
		}
	}

	var diff = (new Date().getTime() - start) - time;
	window.setTimeout(instance, (100 - diff));
}

window.setTimeout(instance, 100);

//Numpad control of movement
//numlock must be off
//$(document).keydown(function(e) {  
//switch(e.which) {
//case 35:
//sendMessageDirect("sw");
//addMessage("sw", cga_light_grayHex, true, false);
//e.preventDefault();
//break;
//case 40:
//sendMessageDirect("s");
//addMessage("s", cga_light_grayHex, true, false);
//e.preventDefault();
//break;
//case 34:
//sendMessageDirect("se");
//addMessage("se", cga_light_grayHex, true, false);
//e.preventDefault();
//break;
//case 37:
//sendMessageDirect("w");
//addMessage("w", cga_light_grayHex, true, false);
//e.preventDefault();
//break;
//case 12:
//sendMessageDirect("rest");
//addMessage("rest", cga_light_grayHex, true, false);
//e.preventDefault();
//break;
//case 39:
//sendMessageDirect("e");
//addMessage("e", cga_light_grayHex, true, false);
//e.preventDefault();
//break;
//case 36:
//sendMessageDirect("nw");
//addMessage("nw", cga_light_grayHex, true, false);
//e.preventDefault();
//break;
//case 38:
//sendMessageDirect("n");
//addMessage("n", cga_light_grayHex, true, false);
//e.preventDefault();
//break;
//case 33:
//sendMessageDirect("ne");
//addMessage("ne", cga_light_grayHex, true, false);
//e.preventDefault();
//break;        
//}      
//});

function showRoom(actionData) {
	items = "";
	var mainText = buildSpan(cga_light_cyan, actionData.Name) + "<br>";
	mainText += buildSpan(cga_light_grayHex, "&nbsp;&nbsp;&nbsp;&nbsp;" + actionData.Description) + "<br>";
//	var items = "";
	if (actionData.VisibleCoinRolls && actionData.VisibleCoinRolls.length > 0) {
		for (var i = 0; i < actionData.VisibleCoinRolls.length; i++) {
			if (actionData.VisibleCoinRolls[i].Count > 0) {
				if (items != "") {
					items += ", ";
				}
				items += String(actionData.VisibleCoinRolls[i].Count) + " ";
				if (actionData.VisibleCoinRolls[i].Count > 1) {
					items += pluralCoinName(actionData.VisibleCoinRolls[i].CoinTypeID);
				} else {
					items += singleCoinName(actionData.VisibleCoinRolls[i].CoinTypeID);
				}
			}
		}
	}
	if (actionData.VisibleItems && actionData.VisibleItems.length > 0) {

		for (var i = 0; i < actionData.VisibleItems.length; i++) {
			if (items != "") {
				items += ", ";
			}
			items += fixStackName(actionData.VisibleItems[i].Count, actionData.VisibleItems[i].Name);
		}

	}
	if (items != "") {
		var youNoticeText = "You notice " + items + " here.";
		mainText += buildSpan(cga_dark_cyan, youNoticeText) + "<br>";
	}
	if (actionData.AlsoHerePlayers.length > 0 || actionData.AlsoHereMobs.length > 0) {
		var alsoHereText = "Also here: ";
		var first = true;
		for (var i = 0; i < actionData.AlsoHerePlayers.length; i++) {
			if (i > 0) {
				alsoHereText += ", ";
			}
			alsoHereText += actionData.AlsoHerePlayers[i].FirstName;
			first = false;
		}
		for (var i = 0; i < actionData.AlsoHereMobs.length; i++) {
			if (i > 0 || !first) {
				alsoHereText += ", ";
			}
			alsoHereText += actionData.AlsoHereMobs[i].Name;
		}
		alsoHereText += ".";
		mainText += buildSpan(cga_light_magenta, alsoHereText) + "<br>";
	}
	var obviousExits = "Obvious exits: ";
	if (actionData.ObviousExits && actionData.ObviousExits.length > 0) {
		for (var i = 0; i < actionData.ObviousExits.length; i++) {
			if (i > 0) {
				obviousExits += ", ";
			}
			obviousExits += actionData.ObviousExits[i];
		}
	} else {
		obviousExits += "None!";
	}
	mainText += buildSpan(cga_dark_green, obviousExits) + "<br>";
	addMessageRaw(mainText, false, true);
}



if (window.location.pathname === "/Characters/Conversations"){
	$('<input id="chkScrollToBottom" type="checkbox"><span>scroll to bottom?</span></input>').insertAfter("#divConversations");
	$("#chkScrollToBottom").click();

	function scrollToBottom() {
		if (window.location.pathname === "/Characters/Conversations"){
			if($("#chkScrollToBottom").prop("checked")){
				var objDiv = document.getElementById("divConversations");
				objDiv.scrollTop = objDiv.scrollHeight;
			}
		} else if(window.location.pathname === "/Characters/Game"){
			var objDiv = document.getElementById("mainScreen");
		    objDiv.scrollTop = objDiv.scrollHeight;
		}
	}
} else if(window.location.pathname === "/Characters/Game"){
var observer1 = new MutationObserver(function(){

//	hides the players (thinking of moving this to the top bar)
	$("#divPlayers").toggle(false);

//	enlarges the mainscreen
	$('#divMainPanel').removeClass('col-lg-10').addClass('col-lg-12');

//	resize the mainscreen to fit on my page (should adjust for different screens/resolutions due to using ems
	$('#mainScreen').css("height", "33em").css("width","47.8em").css("resize","both");

//	remove the existing input stuff
	$('#message').parent().remove();
	$('#chkEnableAI').parent().remove();

//	add the new stuff
	$('<div id="divControls" class="panel col-xs-6 col-sm-6 col-md-3 col-lg-3" style="float:left; height:34em; width:21em;"><div style="width:100%"><input type="checkbox" id="chkEnableAI" value="Enable AI" />Enable AI</div><div style="float:left;width:100%" class="input-group-sm"><input type="text" class="form-control" style="width:100%;max-width:750px;display:inline-block" id="message" autocomplete="false" autocorrect="false" /><input type="button" class="btn" style="width:80px;height:30px;padding:0;" id="sendmessage" value="Send" /></div><div id="commandBtns" style="width:100%; padding:3em 0 0 0; float:left;"><input type="button" class="btn" style="width:7em; height:2em; padding:0;" id="conversationsBtn" value="Conversations" onclick="openConvo()"/><input type="button" class="btn" style="width:5em; height:2em; padding:0;" id="statsBtn" value="Stats" onclick="sendMessageDirect(&quot;st&quot;)"/><input type="button" class="btn" style="width:5em; height:2em; padding:0;" id="mapButton" value="Map" onclick="openMapScreen()" /><input type="button" class="btn" style="width:7em; height:2em; padding:0;" id="expButton" value="Reset Exp/h" onclick="ResetExpPH()" /></div><div id="movement1" style="width:100%; float:left; padding:5em 0 0 3em"><input type="button" id="MoveNW" value="nw" onclick="MoveClick(value)" style="width:3em; height:3em; padding:0;" class="btn" /><input type="button" id="MoveN" value="n" onclick="MoveClick(value)" style="width:3em; height:3em; padding:0;" class="btn" /><input type="button" id="MoveNE" value="ne" onclick="MoveClick(value)" style="width:3em; height:3em; padding:0;" class="btn" /><div id="movement2" style="width:20%; float:right; padding:0 5em 0 0;"><input type="button" id="MoveUP" value="u" onclick="MoveClick(value)" style="width:3em; height:3em; padding:0;" class="btn" /><br><input type="button" id="MoveDOWN" value="d" onclick="MoveClick(value)" style="width:3em; height:3em; padding:0;" class="btn" /></div><br ><input type="button" id="MoveW" value="w" onclick="MoveClick(value)" style="width:3em; height:3em; padding:0;" class="btn" /><input type="button" id="MoveRest" value="Rest" onclick="MoveClick(value)" style="width:3em; height:3em; padding:0;" class="btn" /><input type="button" id="MoveE" value="e" onclick="MoveClick(value)" style="width:3em; height:3em; padding:0;" class="btn" /><br ><input type="button" id="MoveSW" value="sw" onclick="MoveClick(value)" style="width:3em; height:3em; padding:0;" class="btn" /><input type="button" id="MoveS" value="s" onclick="MoveClick(value)" style="width:3em; height:3em; padding:0;" class="btn" /><input type="button" id="MoveSE" value="se" onclick="MoveClick(value)" style="width:3em; height:3em; padding:0;" class="btn" /></div></div><div id="progressMonitors" style="float:left; width:21em;"><div id="hpContainer" style="width:100%; float:left; height:1.5em;"><div style="text-align:center;width:10%;font-weight:200; float:left;">HP:</div><div class="progress" style="width:90%"><div class="progress-bar" style="width:100%; background-color:#e62e00;"><span id="hp">100%</span></div></div></div><div id="maContainer" style="width:100%; float:left; height:1.5em;"><div style="text-align:center;width:10%;font-weight:200; float:left;">MA:</div><div class="progress" style="width:90%;"><div class="progress-bar" style="width:100%; background-color:#3366ff;"><span id="ma">100%</span></div></div></div><div id="expContainer" style="width:100%;float:left; height:1.5em;"><div style="text-align:center;width:10%;font-weight:200; float:left;">EXP:</div><div class="progress" style="width:90%;"><div class="progress-bar" style="width:0%; background-color:#00b300;"><span id="exp">0%</span></div></div></div></div>').insertAfter("#mainScreen");

//	checks the AI and enables
	$('#chkEnableAI').prop( "checked", true );
	sendMessageDirect("EnableAI");

//	removes existing bars
	$('.vertical').remove();

//	this is the only way I have found to get exp sent from the server. This gets the exp bar going.
	sendMessageText("exp");

//	had to re-do this for some reason (possibly because I deleted the first one and created again)
//	should be fine when running direct from html and not loading through jquery/javascript
	$('#chkEnableAI').change(function () {
		if (this.checked) {
			sendMessageDirect("EnableAI");
		} else {
			sendMessageDirect("DisableAI");
		}
	});

//	get the elements to variables
	var buttons = $("#commandBtns");

//	add tools button
	$(buttons).append($('<input type="button" value="Tools" ID="tools" style="width:5em; height:2em; padding:0;" class="btn" onclick="ToolsButton()"/>'));

//	executes the refresh every half second
	var tid = setInterval(RefreshBackScroll,500);

//	if you click on the main screen will activate the input box
	$('#mainScreen').click(function() {
		$('#message').focus(); 
	});

	$("#mainScreen").parent().hover(function(){
		$('body').css('overflow', 'hidden');
	},function(){
		$('body').css('overflow', 'scroll');
	});

//	window.onfocus = function(){ 
//	$('#message').focus(); 
//	};

	$('<ul class="nav navbar-nav" id="playersDropdown"><li class="dropdown"><a class="dropdown-toggle" data-toggle="dropdown">Players<span class="caret"></span></a></button><ul class="dropdown-menu"><li><a href="#" onclick="inGameTopPlayers()" id="topPlayers">Top Players</a></li><li class="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown" id="inRealm">Currently Playing<span class="caret"></span></a></li></li></ul>').insertBefore($("#logoutForm"));

	$("#listPlayers").css("height","24em").addClass("dropdown-menu").addClass("dropdown-menu-right").css("overflow-y","scroll").css("display","").css("margin", "0 0 1em").insertAfter(("#inRealm")).children().click(function(){
		$("#message").val("/" + $(this).text() + " ");
		$("#message").focus();
	});

	$("#inRealm").parent().hover(function(){
		$('body').css('overflow', 'hidden');
		$("#listPlayers").css("display","block");
	},function(){
		$('body').css('overflow', 'scroll');
		$("#listPlayers").css("display","");
	});

	$("#listPlayers").parent().hover(function(){
		$('body').css('overflow', 'hidden');
		$("#listPlayers").css("display","block");
	},function(){
		$('body').css('overflow', 'scroll');
		$("#listPlayers").css("display","");
	});

	$("#playersDropdown").hover(function(){
		$("#playersDropdown li ul").css("display","block");
	}, function() {
		$("#playersDropdown li ul").css("display", "");	
	});

	$('<div style="float:left; padding:7em 0 0 1em;"><label id="ExpPerHour"></label</div>').insertAfter("#movement1");

	observer.observe($("#mainScreen")[0],options);
	options = {"attributes":true};
	observer.observe($("#hp").parent()[0],options);

	observer1.disconnect();
});

var options1 = {"attributes":true, "characterData":true}

observer1.observe($('#playerID')[0],options1);


//watches the main screen and culls the DIV children when gets to 5000 (assuming not needing to scroll back too far)
//also watches the HP attribute for changes and if the percent is < 20 or >= 100 moves and rests;
var count = 1;
var observer = new MutationObserver(function(mutations){

	if($("#mainScreen").children().length > 5000){
		$("#mainScreen").children().remove(":lt(3000)");
	}

	// type your desired item here and this will pick it up if it's in the room, 
	// will repeat until there are no more of that item.
	var desired = ["acid gland", "coral necklace"];
	for(var i = 0; i < desired.length; i++){
		if(items.indexOf(desired[i]) > -1){
			sendMessageDirect("get " + desired[i]);
			sendMessageDirect("");
		}
	}

	// hp check, move and rest
	// move/rest based on playerName must start with case "name": and end with break; if there is no break; code will fall through to next case!
	switch ($(document).attr('title').split(" ")[0]){
	case "Blorgen":
		if(hpPercent <= 40){
			if(resting == false && count == 1){
				var val = $("#message").val();
				MoveClick("s");
				sendMessageDirect("rest");
				$("#message").val(val);
				count -= 1;
			}
		} else if (hpPercent >= 100){
			if(count == 0){
				var val = $("#message").val();
				MoveClick("n");
				$("#message").val(val);
				count += 1;
			}
		}
		break;
	case "Bjorgen":
		if(hpPercent <= 40){
			if(resting == false && count == 1){
				var val = $("#message").val();
				MoveClick("s");
				sendMessageDirect("rest");
				$("#message").val(val);
				count -= 1;
			}
		} else if (hpPercent >= 100){
			if(count == 0){
				var val = $("#message").val();
				MoveClick("n");
				$("#message").val(val);
				count += 1;
			}
		}
		break;
	default:
		// if name is not either of the last specified
		if(hpPercent <= 40){
			if(resting == false && count == 1){
				var val = $("#message").val();
				MoveClick("s");
				sendMessageDirect("rest");
				$("#message").val(val);
				count -= 1;
			}
		} else if (hpPercent >= 100){
			if(count == 0){
				var val = $("#message").val();
				MoveClick("n");
				$("#message").val(val);
				count += 1;
			}
		}
	}	
});
var options = {"childList":true};

}
