/* Controllers */

function VelocityCtrl($window, $scope, enzymeService, experimentService, analysisService, $cookieStore, $http, $compile, $filter) { //this injects the services into the controller - explicit inject below must list patrameters in correct order but is apprently only there for when code minified
	
	$scope.storedCode = null;
	$scope.storedExperiment = null;
	$scope.usingStored=false;
	if($cookieStore.get("enzymeCode")){
		$scope.storedCode = $cookieStore.get("enzymeCode");
		$scope.storedExperiment = $cookieStore.get("experiment");
		$scope.usingStored=true;
		$scope.enzymeParams = new EnzymeParams($scope.storedCode);
		}
	else{
		$scope.enzymeParams = new EnzymeParams();
		}
	
	$scope.reactionParams = new ReactionParams();
	$scope.dataToAnalyse = new Array();  //collected selected data from grid
	
	$scope.setupNewExperiment = function(){
		$scope.newEnzyme();
		$scope.newExperiment();
		$scope.newAnalysis();
		};
	
	$scope.newEnzyme = function(){
		$scope.error=null;
		try {$scope.enzyme = enzymeService;}
		catch(error){$scope.error=error;}
		};
		
	$scope.newExperiment = function(){
		$scope.error=null;
		try {
			$scope.experiment = experimentService;
			if($scope.storedExperiment){
				$scope.experiment.samples=$scope.storedExperiment.samples;
				$scope.experiment.workingVolume = $scope.storedExperiment.workingVolume
				$scope.experiment.timeOfDay = $scope.storedExperiment.timeOfDay
				$scope.experiment.partOfDay = $scope.storedExperiment.partOfDay
				$scope.experiment.runs = $scope.storedExperiment.runs
				$scope.experiment.apparatusIsSetUp = $scope.storedExperiment.apparatusIsSetUp
				$scope.experiment.runNo = $scope.storedExperiment.runNo
				}
			}
		catch(error){$scope.error=error;}
		};
		
	$scope.newAnalysis = function(){
		$scope.error=null;
		try {$scope.analysis = analysisService;}
		catch(error){$scope.error=error;}
		};
		
	$scope.toggleSelection = function(state){
		$scope.gridOptions.$gridScope.toggleSelectAll(state);
		};	
		
	$scope.reStart = function(){
		$cookieStore.remove("enzymeCode");
		$scope.storedExperiment = $cookieStore.remove("experiment");
		location.reload();
		};
		
	$scope.continueWithSaved = function(){
		$scope.usingStored=false; //to hide warning about saved version
		};
	
	//var minHeightOpts = { minHeight: 300 };
	
	var csvOpts = { columnOverrides: { obj: function (o) {
        return o.no + '|' + o.timeOfDay + '|' + o.E + '|' + o.S+ '|' + o.I+ '|' + o.pH+ '|' + o.v;
    	} },
    	iEUrl: 'downloads/download_as_csv'
	};
		
	$scope.gridOptions = { 
			data: 'experiment.runs',
			//showGroupPanel: true,
			plugins: [new ngGridCsvExportPlugin(csvOpts,$http,$window,$compile,$filter)],//ngGridLayoutPlugin,new ngGridFlexibleHeightPlugin(minHeightOpts)],
			selectedItems: $scope.dataToAnalyse,
			columnDefs: [{
				field:'no', 
				displayName:'No.',
				width: '40px'
				},{
				field:'timeOfDay', 
				displayName:'Time of day',
				cellFilter: 'timeFromDecimal',
				width: '100px'
				},{
				field:'E', 
				displayName:'Enz. Vol. (ul)',
				width: '100px'
				}, {
				field:'S',
				displayName:'[S] (mM)',
				width: '80px'
				}, {
				field:'I', 
				displayName:'[I] (mM)',
				width: '80px'
				}, {
				field:'pH', 
				displayName:'pH',
				width: '50px'
				}, {
				field:'v', 
				displayName:'Init. rate (umol/min)'
				}//, {
				//field:'measurementError', 
				//displayName:'Error'
				//}
				],
			afterSelectionChange: function(){
				//$("#output-panel").fadeOut("slow").addClass("hidden");
				$scope.analysis.checkAnalysisEligibility($scope.dataToAnalyse);
				},
			showFooter: true,
			footerRowHeight: 60,
			sortInfo:{
				fields:['no'],
				directions: ['desc']
				},
			enableColumnResize: true
			};
	//ngGridCsvExportPlugin.$inject = ['$http'];
	
	//$scope.saveEnzyme = function(){
		//$scope.enzyme.save($scope.enzymeparams.type,$scope.enzymeparams.k2,$scope.enzymeparams.Km,$scope.enzymeparams.pKa1k2,$scope.enzymeparams.pKa2k2,$scope.enzymeparams.pKa1Km,$scope.enzymeparams.pKa2Km,$scope.enzymeparams.KdIEI,$scope.enzymeparams.KdIESI,$scope.enzymeparams.stddev);
		//};
		
	$scope.runReaction = function(){
		$scope.error=null;
		try {
			$("#output-panel").fadeIn("slow").removeClass("hidden");
			$("#alert-box").fadeOut("slow").addClass("hidden");
			$("#calculation-div").fadeOut("slow").addClass("hidden");
			$("#least-squares-div").fadeOut("slow").addClass("hidden");
			$("#chart-div").fadeIn("slow").removeClass("hidden");
			$scope.enzyme.save($scope.enzymeParams.type,$scope.enzymeParams.k2,$scope.enzymeParams.Km,$scope.enzymeParams.pKa1k2,$scope.enzymeParams.pKa2k2,$scope.enzymeParams.pKa1Km,$scope.enzymeParams.pKa2Km,$scope.enzymeParams.KdIEI,$scope.enzymeParams.KdIESI); //,$scope.enzymeParams.stddev
			var v = $scope.experiment.react($scope.reactionParams.E,$scope.reactionParams.S,$scope.reactionParams.I,$scope.reactionParams.pH,$scope.enzyme); //,$scope.reactionParams.stdDaytime,$scope.reactionParams.stdEvening,$scope.reactionParams.stdLateEvening
			//now let's save enzyme code and experiment in cookieStore
			$cookieStore.put("enzymeCode", $scope.enzymeParams.code);
			$cookieStore.put("experiment", $scope.experiment);
			$scope.usingStored=false;//to hide warning about using saved experiment
			var series = [];
			for(var i=0; i<=30; i+=5){
				var point = [i,i*v];
				series.push(point);
				}
			window.setTimeout(function(){
				$("#alert-box").html('<strong>Initial rate:</strong> ' + v + ' &micro;mol min<sup>-1</sup>');
				$("#alert-box").fadeIn("slow").removeClass("hidden");
				}, 2000);
			$.jqplot('chart-div',  [series],
				{ 
				//title:'Exponential Line',
				// Turns on animation for all series in this plot.
		        animate: true,
		        animateReplot: true,
		        highlighter: {
		            show: true,
		            sizeAdjust: 7.5
		          	},
		        cursor: {
		            show: false
		          	},
		        axes:{
		        	yaxis:{
		        		min:0,
		        		label:'Quantity (&micro;mol)',
	        			},
		        	xaxis:{
		        		min:0,
		        		max:30,
		        		label:'Time (min)',
	        			tickOptions: {
	        			    formatString: '%d'
	        				}
		        		}
		        	},
		        series:[{color:'#5FAB78'}]
			}).replot();
			}
		catch (error){
			$scope.error=error;
			}
		};
		
	$scope.defrostSample = function(sample_id){
		$scope.error=null;
		try {
			$scope.experiment.defrostSample(sample_id);
			$("#output-panel").fadeOut("slow").addClass("hidden");
			}
		catch(error){$scope.error=error;}
		};
		
	$scope.goHome = function(){
		$scope.error=null;
		try {
			$scope.experiment.goHome();
			$("#output-panel").fadeOut("slow").addClass("hidden");
			}
		catch(error){$scope.error=error;}
		};
		
	$scope.goEat = function(){
		$scope.error=null;
		try {
			$scope.experiment.goEat();
			$("#output-panel").fadeOut("slow").addClass("hidden");
			}
		catch(error){$scope.error=error;}
		};
		
	$scope.setupApparatus = function(){
		$scope.error=null;
		try {$scope.experiment.setupApparatus();}
		catch(error){$scope.error=error;}
		};
		
	$scope.calculatePrecision = function(){
		//alert('This will show mean and stdev of results with identical E, S, I and pH');
		$("#output-panel").fadeIn("slow").removeClass("hidden");
		$("#alert-box").fadeOut("slow").addClass("hidden");
		$("#chart-div").fadeOut("slow").addClass("hidden");
		$("#least-squares-div").fadeOut("slow").addClass("hidden");
		$scope.analysis.precision($scope.dataToAnalyse);
		$("#calculation-div").fadeIn("slow").removeClass("hidden");
		};
	
	$scope.calculatepHProfile = function(){
		$("#output-panel").fadeIn("slow").removeClass("hidden");
		$("#alert-box").fadeOut("slow").addClass("hidden");
		$("#calculation-div").fadeOut("slow").addClass("hidden");
		$("#least-squares-div").fadeOut("slow").addClass("hidden");
		var series = [];
		for(var i=0; i<$scope.dataToAnalyse.length; i++){
			var point = [parseFloat(parseFloat($scope.dataToAnalyse[i].pH).toFixed(2)),parseFloat($scope.dataToAnalyse[i].v)];
			series.push(point);
			}
		$.jqplot('chart-div',  [series],
			{ 
			//title:'Exponential Line',
			// Turns on animation for all series in this plot.
	        //animate: true,
	        //animateReplot: true,
	        highlighter: {
	            show: true,
	            sizeAdjust: 7.5
	          	},
	        cursor: {
	            show: false
	          	},
	        axes:{
	        	yaxis:{
	        		min:0,
	        		label:'Initial rate (&micro;mol/min)'
        			},
	        	xaxis:{
	        		min:2,
	        		label:'pH'
        			}
	        	},
	        series:[{
	        	showLine: false,
		        color:'#5FAB78'
	        	}]
		}).replot();
		$("#chart-div").fadeIn("slow").removeClass("hidden");
		};
	
	$scope.calculateKinetics = function(){
		$("#chart-div").fadeOut("slow").addClass("hidden");
		$("#alert-box").fadeOut("slow").addClass("hidden");
		$("#calculation-div").fadeOut("slow").addClass("hidden");
		$scope.analysis.vMaxEst=2;
		$scope.analysis.kmEst=1;
		$scope.analysis.corrCoeff=0;
		$scope.analysis.relaxationFactor=$scope.analysis.relaxationFactors[1];
		$scope.analysis.r2=0;
		$scope.analysis.RMS=0;
		$scope.analysis.df=0;
		$("#least-squares-div").fadeIn("slow").removeClass("hidden");
		$("#output-panel").fadeIn("slow").removeClass("hidden");
		};
		
	$scope.iterateKinetics = function(){
		$scope.analysis.leastSquaresIterate($scope.dataToAnalyse);
		//sort before interpolating
		$scope.dataToAnalyse.sort(function(a,b){return a.S > b.S});
		var dataSeries = [];
		var fittedSeries = [];
		var vEst = 0;
		var estPoint = 0;
		for(var i=0; i<$scope.dataToAnalyse.length; i++){
			//var point = [parseFloat(parseFloat($scope.dataToAnalyse[i].S).toFixed(2)),parseFloat($scope.dataToAnalyse[i].v)];
			var point = [parseFloat($scope.dataToAnalyse[i].S),parseFloat($scope.dataToAnalyse[i].v)];
			dataSeries.push(point);
			//var vEst = ($scope.dataToAnalyse[i].S*$scope.analysis.vMaxEst)/($scope.analysis.kmEst+$scope.dataToAnalyse[i].S); //calulate fitted v at this point
			//var estPoint = [parseFloat(parseFloat($scope.dataToAnalyse[i].S).toFixed(2)),parseFloat(parseFloat(vEst).toFixed(2))];
			//fittedSeries.push(estPoint);
			if(i<$scope.dataToAnalyse.length-1){ //interpolate some points to generate a smooth curve for all but last point
				var noOfSteps = 4;
				var increment = ($scope.dataToAnalyse[i+1].S-$scope.dataToAnalyse[i].S)/noOfSteps;
				for (var j=$scope.dataToAnalyse[i].S; j<$scope.dataToAnalyse[i+1].S; j=j+increment){
					vEst = (j*$scope.analysis.vMaxEst)/($scope.analysis.kmEst+j); //calulate fitted v at this point
					estPoint = [parseFloat(parseFloat(j).toFixed(6)),parseFloat(parseFloat(vEst).toFixed(6))];
					fittedSeries.push(estPoint);
					}
				}
			}
		vEst = ($scope.dataToAnalyse[$scope.dataToAnalyse.length-1].S*$scope.analysis.vMaxEst)/($scope.analysis.kmEst+$scope.dataToAnalyse[$scope.dataToAnalyse.length-1].S); //calulate fitted v at this point
		estPoint = [parseFloat(parseFloat($scope.dataToAnalyse[$scope.dataToAnalyse.length-1].S).toFixed(6)),parseFloat(parseFloat(vEst).toFixed(6))];
		fittedSeries.push(estPoint);
		$("#chart-div").fadeIn("slow").removeClass("hidden");
		$.jqplot('chart-div',  [dataSeries,fittedSeries],
			{ 
			highlighter: {
	            show: true,
	            sizeAdjust: 7.5,
	            tooltipFormatString:'%g',
	            useAxesFormatters: false
	          	},
	        cursor: {
	            show: false
	          	},
	        axes:{
	        	yaxis:{
	        		label:'Initial rate (&micro;mol/min)',
	        		min:0
	        		},
	        	xaxis:{
	        		min:0,
	        	    label:'[Substrate]/mM'
        			}
	        	},
	        series:[{
        		showLine: false,
        		//color:'#5FAB78'
        		},{
    			showLine: true,
    			//color:'#5FAB78',
	        	markerOptions: {
	        		show: false
	        		}
        		}]
		}).replot();
		};
		
		$scope.$on('$viewContentLoaded', function() {
			$(".analysis-button").tooltip();
			$('button.analysis-button:disabled').after(function (e) {
			    d = $("<div>");
			    i = $(this);
			    d.css({
			        height: i.outerHeight(),
			        width: i.outerWidth(),
			        position: "absolute"
			    });
			    d.css(i.offset());
			    d.attr("title", i.attr("title"));
			    d.tooltip();
			    return d;
				});
			});
	
	}
	
var params = [];
var paramRow=[];
paramRow=[2.0,1.6,4.3,7.7,0.0005,1];
params.push(paramRow);
paramRow=[1.0,0.8,5.1,7.8,0.0000007,1];
params.push(paramRow);
paramRow=[0.6,0.4,5.8,7.9,0.003,0.003];
params.push(paramRow);
paramRow=[0.5,0.24,5.9,8.0,0.00002,0.00002];
params.push(paramRow);
paramRow=[0.3,0.2,6.0,8.1,1,0.00001];
params.push(paramRow);
paramRow=[0.1,0.1,6.1,8.2,1,0.0008];
params.push(paramRow);
paramRow=[0.05,0.08,6.2,8.4,0.98,0.0001,0.006];
params.push(paramRow);
paramRow=[0.02,0.04,6.3,8.6,0.00004,0.000009];
params.push(paramRow);
paramRow=[0.01,0.024,6.4,8.8];
params.push(paramRow);
paramRow=[0.001,0.02,6.5,9.0];
params.push(paramRow);

function EnzymeParams(storedCode){
	if(storedCode){
		this.code=storedCode;
		}
	else{
		this.code=[];
		var types = ['PR','DH','HY','DC','PH'];
		this.code[0]=types[getRandomInt(0, 4)];
		this.code[1]=getRandomInt(0, 9);
		this.code[2]=getRandomInt(0, 9);
		this.code[3]=getRandomInt(0, 9); //these two must come from the same column to ensure pKa1 at least 2 < pKa2
		var posspKaEffectValues=[0,1,1,1,2,3];
		this.code[4]=posspKaEffectValues[Math.floor(Math.random()*posspKaEffectValues.length)];//getRandomInt(0, 3);
		this.code[5]=getRandomInt(0, 9);
		this.code[6]=posspKaEffectValues[Math.floor(Math.random()*posspKaEffectValues.length)];
		if(this.code[4]==0&&this.code[6]==0){
			if(Math.random()>0.5){
				this.code[6]=1;
				}
			else{
				this.code[4]=1;
				}
			}
		this.code[7]=getRandomInt(0, 7);
		}
	this.type = this.code[0];//'Protease';
	this.sa = params[this.code[2]][1];
	//this.k2 = params[code[2]][1];//0.24;
	this.Km = params[this.code[1]][0];//0.02;
	switch(this.code[4]){
		case 0:
			this.pKa1k2 = 0;
			this.pKa1Km = 0;
			break;
		case 1:
			this.pKa1k2 = 0;
			this.pKa1Km = params[this.code[3]][2];
			break;
		case 2:
			this.pKa1k2 = params[this.code[3]][2];
			this.pKa1Km = 0;
			break;
		case 3:
			this.pKa1k2 = params[this.code[3]][2];
			this.pKa1Km = params[this.code[3]][2];
			break;
		}
	switch(this.code[6]){
		case 0:
			this.pKa2k2 = -1;
			this.pKa2Km = -1;
			break;
		case 1:
			this.pKa2k2 = -1;
			this.pKa2Km = params[this.code[5]][3];
			break;
		case 2:
			this.pKa2k2 = params[this.code[5]][3];
			this.pKa2Km = -1;
			break;
		case 3:
			this.pKa2k2 = params[this.code[5]][3];
			this.pKa2Km = params[this.code[5]][3];
			break;
			}
	this.KdIEI = params[this.code[7]][4];
	this.KdIESI = params[this.code[7]][5];
	this.stddev = 0;
	this.k2=rnd(0.21, 0.02); //sample from normal distribution
	this.conc=this.k2/this.sa;
};

function ReactionParams(){
	this.E = 5;
	this.S = 20;
	this.I = 0;
	this.pH = 7;
	//this.stdDaytime = 0.05;
	//this.stdEvening = 0.10;
	//this.stdLateEvening = 0.15;
};

/**
 * From: http://stackoverflow.com/questions/1527803/generating-random-numbers-in-javascript-in-a-specific-range
 * Returns a random integer between min and max
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

$(function() {
    $('.tooltip-wrapper').tooltip({position: "left"});
});
	
VelocityCtrl.$inject = ['$window','$scope', 'enzymeService','experimentService','analysisService','$cookieStore','$http','$compile','$filter']; //note order must match order of parameters in controller declaration above