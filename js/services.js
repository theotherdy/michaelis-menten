/* Services */

angular.module('michaelisMenten.services', [])  //creates new module
	.constant('MINIMUM_VELOCITY','0.2')  //This is the configuration block where you can declare contsnts, services, etc.
	.constant('MAXIMUM_VELOCITY','10')
	.constant('INFINITY','1')
	.constant('NO_OF_SAMPLES','6')
	.constant('VOL_PER_SAMPLE','500')  //start with 500 µl
	.constant('TIME_PER_RUN','0.5')  //half hour
	.constant('TIME_PER_ANALYSIS','0.5')  //half hour
	.constant('SET_UP_APPARATUS','1')  //half hour
	.constant('START_OF_DAY','9.0')  
	.constant('START_OF_LUNCH','12.5')
	.constant('START_OF_AFTERNOON','13.5')
	.constant('START_OF_TEA','17.5')
	.constant('START_OF_EVENING','18.0')
	.constant('START_OF_LATE_EVENING','20.0')
	.constant('END_OF_DAY','24.0')
	.constant('STD_PR','0.21')
	.constant('STD_DH','0.29')
	.constant('STD_HY','0.27')
	.constant('STD_DC','0.23')
	.constant('STD_PH','0.25')
	.service('enzymeService', ['INFINITY',Enzyme])  //inject INFINITY into Enzyme - matched by constructor parameters
	.service('experimentService', ['NO_OF_SAMPLES','VOL_PER_SAMPLE','MINIMUM_VELOCITY','MAXIMUM_VELOCITY','TIME_PER_RUN','TIME_PER_ANALYSIS','SET_UP_APPARATUS','START_OF_DAY','START_OF_LUNCH','START_OF_AFTERNOON','START_OF_TEA','START_OF_EVENING','START_OF_LATE_EVENING','END_OF_DAY','STD_PR','STD_DH','STD_HY','STD_DC','STD_PH',Experiment]) //,'STD_DAYTIME','STD_EVENING','STD_LATE_EVENING'
	.service('analysisService', [Analysis]);

/** 
 * Creates instance of Enzyme
 * 
 * @constructor
 * @this {Enzyme}
 * 
**/

function Enzyme(INFINITY){
	this.INFINITY = INFINITY;	
	}

/** 
 * Calculates initial velocity of reaction
 *
 *
 * @this {Enzyme}
 * @param {number} E Volume of enzyme (µl)
 * @param {number} S Concentration of substrate (mM)
 * @param {number} I Concentration of inhibitor (mM)
 * @param {number} pH Used to determine Hplus from pH = -log10(Hplus)
 * @param {number} stDev Used to work out errors on mesaurements
 * @return {number} v The initial velocity of the reaction (µmol/min)
 */
Enzyme.prototype.initialVelocity = function(E,S,I,pH){
	var k2Term = 0; //vmax (top) portion of equation
	var KmTerm = 0; //Km (bottom) portion of equation
	var k2AcidDissosTerm = 0; //affected by values of pKa1k2 and pKa2k2
	var KmAcidDissosTerm = 0; //affected by values of pKa1Km and pKa2Km
	var k2AcidDissosProtonatedTerm = 0; //affected by value of pKa1k2
	var k2AcidDissosDeprotonatedTerm = 0; //affected by value of pKa2k2
	var KmAcidDissosProtonatedTerm = 0; //affected by value of pKa1Km
	var KmAcidDissosDeprotonatedTerm = 0; //affected by value of pKa2Km
	var compDissosTerm = 0; //affected by values of KdIEI
	var uncompDissosTerm = 0; //affected by values of KdIESI
	
	Hplus = Math.pow(10,-pH);
	
	if(this.Ka1k2>=this.INFINITY){
		k2AcidDissosProtonatedTerm = 0;
		}
	else{
		k2AcidDissosProtonatedTerm = Hplus/this.Ka1k2;
		}
	if(this.Ka1Km>=this.INFINITY){
		KmAcidDissosProtonatedTerm = 0;
		}
	else{
		KmAcidDissosProtonatedTerm = Hplus/this.Ka1Km;
		}
	
	k2AcidDissosDeprotonatedTerm = this.Ka2k2/Hplus;
	KmAcidDissosDeprotonatedTerm = this.Ka2Km/Hplus;
	
	k2AcidDissosTerm = 1 + k2AcidDissosProtonatedTerm + k2AcidDissosDeprotonatedTerm; //affected by values of pKa1k2 and pKa2k2
	KmAcidDissosTerm = 1 + KmAcidDissosProtonatedTerm + KmAcidDissosDeprotonatedTerm; //affected by values of pKa1Km and pKa2Km
	
	if(this.KdIEI>=this.INFINITY){
		compDissosTerm = 1;
		}
	else{
		compDissosTerm = 1 + ((I/1000)/this.KdIEI);
		}
	if(this.KdIESI>=this.INFINITY){
		uncompDissosTerm = 1;
		}
	else{
		uncompDissosTerm = 1 + ((I/1000)/this.KdIESI);
		}
	
	k2Term = ((this.k2*E)/k2AcidDissosTerm)*S/1000;
	KmTerm= (this.Km/1000)*KmAcidDissosTerm*compDissosTerm+(S/1000)*uncompDissosTerm;
	
	var v = k2Term/KmTerm;
	return v;
	};

/** 
 * Saves an enzymes parameters
 *
 * @this {Enzyme}
 * @param {string} type Type of enzyme (Protease, Dehydrogenase, Hydratase, Decarboxylase, Phosphatase)
 * @param {number} k2 Catalytic constant (µmol/min)
 * @param {number} Km Michaelis constant (mM)
 * @param {number} pKa1k2 Acid dissociation contant Ka1k2 of a group which reduces k2 when protonated - pKa1k2 = -log10(Ka1k2): 0 gives 'infinite' Ka1k2 of 1 which removes this term from equation
 * @param {number} pKa2k2 Acid dissociation contant Ka2k2 of a group which reduces k2 when deprotonated - pKa2k2 = -log10(Ka2k2): -1 indicates Ka2k2 should be 0 which removes this term from equation
 * @param {number} pKa1Km Acid dissociation contant Ka1Km of a group which increases Km when protonated - pKa1Km = -log10 (Ka1Km): 0 gives 'infinite' Ka1Km of 1 which removes this term from equation
 * @param {number} pKa2Km Acid dissociation contant Ka2Km of a group which increases Km when deprotonated - pKa2Km = -log10(Ka2Km): -1 indicates Ka2Km should be 0 which removes this term from equation
 * @param {number} KdIEI Competitive dissociation constant for the inhibitor (M)
 * @param {number} KdIESI Uncompetitive dissociation constant for the inhibitor (M)
 * @param {number} stddev Standard deviation for the measurement of the initial velocity (µmol/min)
 */
Enzyme.prototype.save = function(type,k2,Km,pKa1k2,pKa2k2,pKa1Km,pKa2Km,KdIEI,KdIESI){	
	//this.infinity = 1; //numbers greater than or equal to this are treated as infinite - equate to input pF or pK values of 0
	this.type = type;
	this.k2 = k2;
	this.Km = Km;
	//this.pKa1k2 = pKa1k2;  //These properties are only here to allow binding to the view
	//this.pKa2k2 = pKa2k2;  
	//this.pKa1Km = pKa1Km;
	//this.pKa2Km = pKa2Km;
	//The two acid dissociation contants for the protonated scenario must be greater than 0 to avoid divide by zero errors
	if(Math.pow(10,-pKa1k2)<=0){
		throw new Error("Ka1k2 must be > 0");
		return false;
		}
	else{
		this.Ka1k2 = Math.pow(10,-pKa1k2);
		}
	if(Math.pow(10,-pKa1Km)<=0){
		throw new Error("Ka1Km must be > 0");
		return false;
		}
	else{
		this.Ka1Km = Math.pow(10,-pKa1Km);
		}
	if(pKa2k2==-1){
		this.Ka2k2 = 0;
		}
	else{
		this.Ka2k2 = Math.pow(10,-pKa2k2);
		}
	if(pKa2Km==-1){
		this.Ka2Km = 0;
		}
	else{
		this.Ka2Km = Math.pow(10,-pKa2Km);;
		}
	//the two dissociation constants for inhibitors must be greater than zero to avoid divide by zero errors
	if(KdIEI<=0){
		throw new Error("KdIEI must be > 0");
		return false;
		}
	else{
		this.KdIEI = KdIEI;
		}
	if(KdIESI<=0){
		throw new Error("KdIESI must be > 0");
		return false;
		}
	else{
		this.KdIESI = KdIESI;
		}
	return true;
};	
	
/** 
 * Calculates specific activity of the enzyme
 *
 *
 * @this {Enzyme}
 * @param {number} E Volume of enzyme (µl)
 * @param {number} conc Concentration of enzyme (mg/ml)
 * @return {number} specific activity Specific activity of the enzyme (mmol product/min/mg enzyme)
 */
/*Enzyme.prototype.specificActivity = function(E, conc){
	var pH = 7;
	var S = 20;
	var I = 0;
	var v = this.initialVelocity(E, S, I, pH);
	var specificActivity = v/(E*conc);
	return specificActivity;
	};*/
	
/** 
 * Creates instance of Experiment
 * 
 * @constructor
 * @this {Experiment}
 * 
**/

function Experiment(NO_OF_SAMPLES,VOL_PER_SAMPLE,MINIMUM_VELOCITY,MAXIMUM_VELOCITY,TIME_PER_RUN,TIME_PER_ANALYSIS,SET_UP_APPARATUS,START_OF_DAY,START_OF_LUNCH,START_OF_AFTERNOON,START_OF_TEA,START_OF_EVENING,START_OF_LATE_EVENING,END_OF_DAY,STD_PR,STD_DH,STD_HY,STD_DC,STD_PH){ //,STD_DAYTIME,STD_EVENING,STD_LATE_EVENING
	this.NO_OF_SAMPLES = parseInt(NO_OF_SAMPLES);
	this.VOL_PER_SAMPLE = parseFloat(VOL_PER_SAMPLE);
	this.MINIMUM_VELOCITY = parseFloat(MINIMUM_VELOCITY);
	this.MAXIMUM_VELOCITY = parseFloat(MAXIMUM_VELOCITY);
	this.TIME_PER_RUN = parseFloat(TIME_PER_RUN);
	this.TIME_PER_ANALYSIS = parseFloat(TIME_PER_ANALYSIS);
	this.SET_UP_APPARATUS = parseFloat(SET_UP_APPARATUS);
	this.START_OF_DAY = parseFloat(START_OF_DAY);
	this.START_OF_LUNCH = parseFloat(START_OF_LUNCH);
	this.START_OF_AFTERNOON = parseFloat(START_OF_AFTERNOON);
	this.START_OF_TEA = parseFloat(START_OF_TEA);
	this.START_OF_EVENING = parseFloat(START_OF_EVENING);
	this.START_OF_LATE_EVENING = parseFloat(START_OF_LATE_EVENING);
	this.END_OF_DAY = parseFloat(END_OF_DAY);
	this.STD_PR = parseFloat(STD_PR);
	this.STD_DH = parseFloat(STD_DH);
	this.STD_HY = parseFloat(STD_HY);
	this.STD_DC = parseFloat(STD_DC);
	this.STD_PH = parseFloat(STD_PH);
	this.samples=[];
	for(var i=0; i<this.NO_OF_SAMPLES; i++){
		sample={id:i,status:'full'};
		this.samples[i]=sample;  //'full' indicates a full, unfrozen sample, 'empty' indicates empty - contents transferred to workingVolume
		}
	this.workingVolume = 0; //working volume of enzyme - from that defrosted
	this.timeOfDay = this.START_OF_DAY;  //all experiments start at 9:00
	this.partOfDay = '';
	this.updatePartOfDay();
	this.runs = []; //array to hold runs
	this.apparatusIsSetUp = false; //array to hold runs
	this.runNo = 1;
	}	


/** 
 * Carry out an enzyme reaction
 *
 *
 * @this {Experiment}
 * @param {number} E Volume of enzyme (µl)
 * @param {number} S Concentration of substrate (mM)
 * @param {number} I Concentration of inhibitor (mM)
 * @param {number} pH Used to determine Hplus from pH = -log10(Hplus)
 * @param {Enzyme} Enzyme object
 * @return {errors} Any errors..
 */
Experiment.prototype.react=function(E,S,I,pH,Enzyme){
	//check allowed values?
	//check enough volumne reamining?
	//check enough time remaining?
	
	
	var run={};
	run.E=E;
	run.S=S;
	run.I=I;
	run.pH=pH;
	//run.Enzyme=Enzyme;
	
	//save and then increment time of day
	run.timeOfDay = this.timeOfDay;
	var stdDev = eval('this.STD_'+Enzyme.type);
	if(this.timeOfDay>=this.START_OF_EVENING && this.timeOfDay<this.START_OF_LATE_EVENING){
		stdDev = stdDev * 2;
		}
	else if(this.timeOfDay>=this.START_OF_LATE_EVENING){
		stdDev = stdDev * 4;
		}
	
	var v = Enzyme.initialVelocity(E,S,I,pH);
	
	//var vMax = Enzyme.k2 * E;
	var vMax = 10; //note always basing errors in VMax of 10
	
	//calculate error based on vMax and stdDev (based on time of day)
	
	var measurementError = rnd(vMax, stdDev)-vMax; //gives +ve or -ve error relative to vMax
	
	//run.measurementError = measurementError;
	
	//apply random value of up to 1 stdev around v, then round to 2 decimal places
	//run.v=parseFloat(rnd(v, stdDev)).toFixed(2);//rnd(v, stdDev);
	
	run.v=parseFloat(v + measurementError).toFixed(2);//rnd(v, stdDev);
	
	//check v not too fast or slow
	if(run.v<this.MINIMUM_VELOCITY){
		throw new Error("Reaction is too slow");
		return false;
		}
	if(run.v>this.MAXIMUM_VELOCITY){
		throw new Error("Reaction is too fast");
		return false;
		}
	
	this.timeOfDay+=this.TIME_PER_RUN;
	this.updatePartOfDay();
	
	//remove sample volume
	if(run.E>this.workingVolume){
		throw new Error("You do not have enough working enzyme available");
		return false;
		}
	else{
		this.workingVolume -= run.E;
		}
	run.no=this.runNo;
	this.runNo++;
	this.runs.push(run);
	return run['v'];
	};
	
/** 
 * Defrost a sample
 *
 *
 * @this {Experiment}
 * 
 */
Experiment.prototype.defrostSample=function(sample_id){
	if(this.samples[sample_id].status=="empty"){
		throw new Error("Sample has already been defrosted");
		return false;
		}
	else{
		this.workingVolume += this.VOL_PER_SAMPLE;
		this.samples[sample_id].status="empty";
		}
	};
	
/** 
 * Go home
 *
 *
 * @this {Experiment}
 * 
 */
Experiment.prototype.goHome=function(){
	this.workingVolume = 0;
	this.timeOfDay = this.START_OF_DAY;  
	this.updatePartOfDay();
	this.apparatusIsSetUp = false; 
	};
	
/** 
 * Go eat
 *
 *
 * @this {Experiment}
 * 
 */
Experiment.prototype.goEat=function(){
	if(this.partOfDay == 'lunch'){
		this.timeOfDay = this.START_OF_AFTERNOON; 
		}
	else if(this.partOfDay == 'tea'){
		this.timeOfDay = this.START_OF_EVENING; 
		}
	this.updatePartOfDay();
	};
	
/** 
 * Go eat
 *
 *
 * @this {Experiment}
 * 
 */
Experiment.prototype.updatePartOfDay=function(){
	if(this.timeOfDay == this.START_OF_DAY){
		this.partOfDay = 'start';
		}
	else if(this.timeOfDay >= (this.START_OF_DAY + this.SET_UP_APPARATUS) && this.timeOfDay < this.START_OF_LUNCH){
		this.partOfDay = 'morning';
		}
	else if(this.timeOfDay >= this.START_OF_LUNCH && this.timeOfDay < this.START_OF_AFTERNOON){
		this.partOfDay = 'lunch';
		}
	else if(this.timeOfDay >= this.START_OF_AFTERNOON && this.timeOfDay < this.START_OF_TEA){
		this.partOfDay = 'afternoon';
		}
	else if(this.timeOfDay >= this.START_OF_TEA && this.timeOfDay < this.START_OF_EVENING){
		this.partOfDay = 'tea';
		}
	else if(this.timeOfDay >= this.START_OF_EVENING && this.timeOfDay < this.START_OF_LATE_EVENING){
		this.partOfDay = 'evening';
		}
	else if(this.timeOfDay >= this.START_OF_LATE_EVENING && this.timeOfDay < this.END_OF_DAY){
		this.partOfDay = 'late';
		}
	if(this.timeOfDay >= this.END_OF_DAY){
		this.partOfDay = 'end';
		}
	};
	
/** 
 * Set up apparatus
 *
 *
 * @this {Experiment}
 * 
 */
Experiment.prototype.setupApparatus=function(){
	this.apparatusIsSetUp = true; 
	this.timeOfDay+=this.SET_UP_APPARATUS;
	this.updatePartOfDay();
	};


/** 
 * Creates instance of Analysis
 * 
 * @constructor
 * @this {Analysis}
 * 
**/

function Analysis(){
	this.EsAreSame=false;
	this.SsAreSame=false;
	this.IsAreSame=false;
	this.pHsAreSame=false;
	//this.dataToAnalyse=[];  //populated by grid when rows selected
	this.n=0;
	this.mean=0;
	this.sd=0;
	this.vMaxEst=2;
	this.kmEst=1;
	this.corrCoeff=0;
	this.fittingFunction="(a*x)/(b+x)";
	this.relaxationFactors = [
	                 {value:'1.0'},
	                 {value:'0.5'},
	                 {value:'0.2'},
	                 {value:'0.1'},
	                 {value:'0.05'}
	               ];
	this.relaxationFactor=this.relaxationFactors[1];
	this.r2=0;
	this.RMS=0;
	this.df=0;
	}

/** 
 * Check Analysis Eligibility
 * Work out which of E, S, I and pH are the same to determine wqhich analysis button(s) to enable
 *
 * @this {Analysis}
 *@param {array} selectedRows Contents of selected rows in grid
 * 
 */

Analysis.prototype.checkAnalysisEligibility=function(selectedRows){//selectedRows){
	if(selectedRows.length>1){  //only bother if there is moe than one selection
		var lastE = null;
		var lastS = null;
		var lastI = null;
		var lastpH = null;
		var tempEsAreSame=true;
		var tempSsAreSame=true;
		var tempIsAreSame=true;
		var temppHsAreSame=true;
		this.n=selectedRows.length;
		for(var i=0;i<this.n;i++){
			if(i>0){
				if(lastE!=parseFloat(selectedRows[i].E))tempEsAreSame=false;
				if(lastS!=parseFloat(selectedRows[i].S))tempSsAreSame=false;
				if(lastI!=parseFloat(selectedRows[i].I))tempIsAreSame=false;
				if(lastpH!=parseFloat(selectedRows[i].pH))temppHsAreSame=false;
				}
			lastE = parseFloat(selectedRows[i].E);
			lastS = parseFloat(selectedRows[i].S);
			lastI = parseFloat(selectedRows[i].I);
			lastpH = parseFloat(selectedRows[i].pH);
			}
		this.EsAreSame=tempEsAreSame;
		this.SsAreSame=tempSsAreSame;
		this.IsAreSame=tempIsAreSame;
		this.pHsAreSame=temppHsAreSame;
		}
	else{
		this.EsAreSame=false;
		this.SsAreSame=false;
		this.IsAreSame=false;
		this.pHsAreSame=false;
		}
	};
	
/** 
 * Precision
 * Populates n, mean and SD for selected rows
 *
 * @this {Analysis}
 * @param {array} selectedRows Contents of selected rows in grid
 * 
 */

Analysis.prototype.precision=function(selectedRows){//selectedRows){
	var velocityArray=[];
	for(var i=0;i<this.n;i++){
		velocityArray[i]=parseFloat(selectedRows[i].v);
		}
	this.mean=parseFloat(ss.mean(velocityArray).toPrecision(4)); //ie 4 sig fig with trailing zeros removed
	this.sd=parseFloat(Math.sqrt(ss.sample_variance(velocityArray)).toPrecision(4)); //ie 4 sig fig with trailing zeros removed
	//this.sd=parseFloat(ss.standard_deviation(velocityArray).toPrecision(4)); //ie 4 sig fig with trailing zeros removed
	};
	
/**
 * LeastSquaresIterate
 * Calculates new estimates of vmax and Km from selected data
 * This and functions 
 */
	
Analysis.prototype.leastSquaresIterate=function(selectedRows){
	
	/*
	 * 
	 * NOTE THAT NEED TO REMOVE POINTS WHERE S > 25 x Km !!!!!!!!
	 * 
	 */
	
	var pointsToFit = [];
	for(var i=0;i<selectedRows.length;i++){
		pointsToFit[i]=[parseFloat(selectedRows[i].S),parseFloat(selectedRows[i].v)];
		}
	
	//pointsToFit[0]=[0, 0];
	//pointsToFit[1]=[1, 1];
	//pointsToFit[2]=[2, 1.5];
	//pointsToFit[3]=[3, 1.7];
	//pointsToFit[4]=[4, 1.8];
		
	var cccSW = 0;
	var cccAv = 0;
	var cccSD = 0;
	
	nPts = pointsToFit.length; //eval(form.cPts.value);
	nPar = 2;
	nVar = 1;
	dgfr = nPts - nPar;
	var St95 = AStudT( 0.05 , dgfr );
	var Pctile = 0.5;

	var a = this.vMaxEst;//eval(form.ca.value); 
	var p1 = a; 
	Par[0] = a;
	var b = this.kmEst;//eval(form.cb.value); 
	var p2 = b; 
	Par[1] = b;
	var c = 0; 
	var p3 = c; 
	Par[2] = c;
	var d = 0; 
	var p4 = d; 
	Par[3] = d;
	var e = 0; 
	var p5 = e; 
	Par[4] = e;
	var f = 0; 
	var p6 = f; 
	Par[5] = f;
	var g = 0; 
	var p7 = g; 
	Par[6] = g;
	var h = 0; 
	var p8 = h; 
	Par[7] = h;

	//var da = Xlate(form.data.value,Tb,",");
	//form.data.value = da;
	//if( da.indexOf(NL)==-1 ){ 
		//if( da.indexOf(CR)>-1 ) {
			//NL = CR; 
			//} 
		//else { 
			//NL = LF; 
			//} 
		//}

	//var o = "y = " + this.fittingFunction + NL;
	//for (var i=1; i<=nVar; i++) {
		//o = o + "     x" + i + "   ";
		//}
	//o = o + "     y         yc       y-yc      SEest      YcLo      YcHi  " + NL;

	var RMS = 0;

	for (var j = 0; j<nPar*(nPar+1); j++) {
		Arr[j] = 0; 
		}
	for (var i = 1; i<=nPts; i++) {
		//l = da.indexOf(NL); 
		//if( l==-1 ) {
			//l = da.length; 
			//};
		//var v = da.substring(0,l);
		//da = da.substring(l+NL.length,da.length);  //shorten data array left to process
		//for (j = 0; j<nVar; j++) {
			//l = v.indexOf(","); 
			//if( l==-1 ) { 
				//l = v.length; 
				//};
			//xArr[j] = eval(v.substring(0,l));
			xArr[0] = pointsToFit[i-1][0]; //ie S
			//o = o + Fmt(xArr[j]);
			//v = v.substring(l+1,v.length);
			//}
		var x  = xArr[0]; 
		//x1 = eval("x");
		//x = x1; 
		var t = x;
		//var x2 = xArr[1]; 
		//x2 = eval("x2");
		//var x3 = xArr[2]; 
		//x3 = eval("x3");
		//var x4 = xArr[3]; 
		//x4 = eval("x4");
		//var x5 = xArr[4]; 
		//x5 = eval("x5");
		//var x6 = xArr[5]; 
		//x6 = eval("x6");
		//var x7 = xArr[6]; 
		//x7 = eval("x7");
		//var x8 = xArr[7]; 
		//x8 = eval("x8");
		var yc = eval(this.fittingFunction); //ie apply functuion to x //eval( form.funct.value );

		//l = v.indexOf(","); 
		//if( l==-1 ) { 
			//l = v.length; 
			//};
		//y = eval(v.substring(0,l));
		y = pointsToFit[i-1][1]; //ie v
		//v = v.substring(l+1,v.length);

		var vSEy = 1;

		yo = y;
		//o = o + Fmt(y);

		w = eval(vSEy);
		if(w==0) { 
			w = 0.001; 
			}

		var yTr = "y";
		var yT = eval( yTr );
		if(yTr=="Ln(y)") {
			w = w / y; 
			}
		if(yTr=="Sqrt(y)") { 
			w = w / yT; 
			}
		if(yTr=="1/y") { 
			w = w / y*y; 
			}
		y = yT;
		cccSW = cccSW + 1 / ( w * w );
		cccAv = cccAv + yc / ( w * w );
		cccSD = cccSD + ( y - ccAv ) * ( y - ccAv ) / ( w * w );

		for (var j=0; j<nPar; j++) {
			var Save = Par[j]; 
			var Del;
			if(Save==0) {
				Del = 0.0001;
				} 
			else {
				Del = Save/1000;
				}
			Par[j] = Save + Del;
			a=Par[0]; 
			b=Par[1]; 
			c=Par[2]; 
			d=Par[3]; 
			e=Par[4]; 
			f=Par[5]; 
			g=Par[6]; 
			h=Par[7];
			p1=a; 
			p2=b; 
			p3=c; 
			p4=d; 
			p5=e; 
			p6=f; 
			p7=g; 
			p8=h;
			Der[j] = ( eval(this.fittingFunction)- yc ) / ( Del * w );//form.funct.value ) - yc ) / ( Del * w );
			Par[j] = Save;
			a=Par[0]; 
			b=Par[1]; 
			c=Par[2]; 
			d=Par[3]; 
			e=Par[4]; 
			f=Par[5]; 
			g=Par[6]; 
			h=Par[7];
			p1=a; 
			p2=b; 
			p3=c; 
			p4=d; 
			p5=e; 
			p6=f; 
			p7=g; 
			p8=h;
			}
		Der[nPar] = (y - yc) / w;
		RMS = RMS + Der[nPar]*Der[nPar];
		for (var j=0; j<nPar; j++) {
			for (var k=0; k<=nPar; k++) {
				Arr[ix(j,k)] = Arr[ix(j,k)] + Der[j] * Der[k];
				}
			}
		var SEest = 0;
		for (var j=0; j<nPar; j++) {
			SEest = SEest + Cov[ix(j,j)] * Der[j] * Der[j];
			for (var k=j+1; k<nPar; k++) {
				SEest = SEest + 2 * Cov[ix(j,k)] * Der[j] * Der[k];
				}
			}
		SEest=w*Sqrt(SEest);
		var yco=yc; var ycl=yc-St95*SEest; var ych=yc+St95*SEest;
		if(yTr=="Ln(y)") { 
			yco=Exp(yc); 
			ycl=Exp(ycl); 
			ych=Exp(ych);
			}
		if(yTr=="Sqrt(y)") { 
			yco=yc*yc; 
			ycl=ycl*ycl; 
			ych=ych*ych;
			}
		if(yTr=="1/y") { 
			yco=1/yc; 
			ycl=1/ycl; 
			ych=1/ych; 
			}

		//o = o + (Fmt(yco) + Fmt(yo-yco) + Fmt(SEest) + Fmt(ycl) + Fmt(ych) + NL);

		}

	ccSW = cccSW;
	ccAv = cccAv / ccSW;
	ccSD = cccSD / ccSW;
	var GenR2 = (ccSD-(RMS/ccSW))/ccSD;
	var GenR = Sqrt(GenR2);
	//o = o + ( NL + "Corr. Coeff. = " + vFmt(GenR) + ";  r*r = " + vFmt(GenR2) );

	RMS = Sqrt(RMS/Max(1,dgfr));
	//o = o + ( NL + "RMS Error = " + vFmt(RMS) + ";  d.f = " + dgfr + NL );

	for (i=0; i<nPar; i++) { var s = Arr[ix(i,i)]; Arr[ix(i,i)] = 1;
		for (k=0; k<=nPar; k++) { Arr[ix(i,k)] = Arr[ix(i,k)] / s; }
		for (j=0; j<nPar; j++) {
			if (i!=j) { s = Arr[ix(j,i)]; Arr[ix(j,i)] = 0;
				for (k=0; k<=nPar; k++) {
					Arr[ix(j,k)] = Arr[ix(j,k)] - s * Arr[ix(i,k)];
					}
				}
			}
		}
	var FRelax = this.relaxationFactor.value; //eval(form.RelaxF[form.RelaxF.selectedIndex].text);
	//o = o + ( NL + "Parameter Estimates..." + NL );
	for( i=0; i<nPar; i++) {
		Par[i] = Par[i] + FRelax * Arr[ix(i,nPar)];
		SEP[i] = RMS * Sqrt(Arr[ix(i,i)]);
		//o = o + ( "p" + (i+1) + "=" + vFmt(Par[i]) + " +/- " + vFmt(SEP[i]) + "; p=" + Fmt(StudT(Par[i]/SEP[i],dgfr)) + NL );
		}

	//o = o + ( NL + "Covariance Matrix Terms..." + NL );
	for (j=0; j<nPar; j++) {
		for (k=j; k<nPar; k++) {
			Cov[ix(j,k)] = Arr[ix(j,k)] * RMS * RMS;
			//o = o + ( "B(" + (j+1) + "," + (k+1) + ") = " );
			if(j==k) {
				//o = o + ( "         " ); 
				}
			else {
				//o = o + ( "B(" + (k+1) + "," + (j+1) + ") = " );
				}
			//o = o + Cov[ix(j,k)];
			//v = Fmt(Cov[ix(j,k)]/Sqrt(Cov[ix(j,j)]*Cov[ix(k,k)]));
			if (j!=k) { 
				//o = o + ("; r=" + v.substring(v.length-7,v.length));
				}
			//o = o + NL;
			}
		}
	this.vMaxEst = Par[0]; //form.ca.value = "" + Par[0];
	this.kmEst = Par[1]; //form.cb.value = "" + Par[1];
	this.corrCoeff = GenR; //form.corr.value = "" + GenR;
	this.r2=GenR2;
	this.RMS=RMS;
	this.df=dgfr;
	};

//Stdev generation from here http://www.protonfish.com/random.shtml
function rnd_snd() {
	return (Math.random()*2-1)+(Math.random()*2-1)+(Math.random()*2-1);
	}

function rnd(mean, stdev) {
	return rnd_snd()*stdev+mean;
}

//functions adapted from: http://www.statpages.info/
var Pi=Math.PI; 
var PiD2=Pi/2; 
var PiD4=Pi/4; 
var Pi2=2*Pi;
var Deg=180/Pi;

var Par = new createArray(0,0,0,0,0,0,0,0);
var SEP = new createArray(1,1,1,1,1,1,1,1);
var Der = new createArray(0,0,0,0,0,0,0,0,0);
var Arr = new createArray(0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0);
var Cov = new createArray(0,0,0,0,0,0,0,0,   0,0,0,0,0,0,0,0,   0,0,0,0,0,0,0,0,   0,0,0,0,0,0,0,0,   0,0,0,0,0,0,0,0,   0,0,0,0,0,0,0,0,   0,0,0,0,0,0,0,0,   0,0,0,0,0,0,0,0  );
var xArr = new createArray(0,0,0,0,0,0,0,0,0);

var CR = unescape("%0D");
var LF = unescape("%0A");
var Tb = unescape("%09");
var NL = CR + LF;

var i = 0; var j = 0; var k = 0; var l = 0; var m = 0;

var nPar = 0;
var nVar = 0;
var nPts = 0;

var ccSW = 1;
var ccAv = 0;
var ccSD = 1;

function Fact(n) {
    if(n==0) { 
    	return 1;
    	}
    if(n<0 & n>-1) {
    	n=n+1; 
    	return Math.exp((n+0.5)*Math.log(n+1)-n-n*(0.1121105+n*0.08106103)/(1.452342+n*(2.410858+n)))/n;
    	}
    var a=0; 
    if(n<0) { 
    	n=Math.abs(n)-1; 
    	a=1;
    	}
    var r=n;
    if((n%1)==0) {
    	while(n>1) {
    		n=n-1; r=r*n ;
    		}
    	}
    else { 
    	r=Math.exp(Math.abs((n+0.5)*Math.log(n+1)-n-n*(0.1121105+n*0.08106103)/(1.452342+n*(2.410858+n))));
    	}
    if(a==1) { 
    	r=-Pi/(r*Math.sin(Pi*n)); 
    	}
    return r;
    }

function Abs(x) { return Math.abs(x); }
function Sqrt(x) { return Math.sqrt(x); }
function Exp(x) { return Math.exp(x); }
function Ln(x) { return Math.log(x); }
function Log10(x) { return Math.log(x)/Math.log(10); }
function Log2(x) { return Math.log(x)/Math.log(2); }
function Power(x,y) { return Math.pow(x,y); }
function Sin(x) { return Math.sin(x); }
function Cos(x) { return Math.cos(x); }
function Tan(x) { return Math.sin(x)/Math.cos(x); }
function Cot(x) { return Math.cos(x)/Math.sin(x); }
function Sec(x) { return 1/Math.cos(x); }
function Csc(x) { return 1/Math.sin(x); }
function ATan(x) { return Math.atan(x); }
function ASin(x) { return Math.asin(x); }
function ACos(x) { return Math.acos(x); }
function ACot(x) { return ATan(1/x); }
function ASec(x) { return ACos(1/x); }
function ACsc(x) { return ASin(1/x); }

function SinH(x) { return (Math.exp(x)-Math.exp(-x))/2; }
function CosH(x) { return (Math.exp(x)+Math.exp(-x))/2; }
function TanH(x) { return SinH(x)/CosH(x); }
function CotH(x) { return 1/TanH(x); }
function SecH(x) { return 1/CosH(x); }
function CscH(x) { return 1/SinH(x); }
function ASinH(x) { return Math.log(x+Math.sqrt(x*x+1)); }
function ACosH(x) { return Math.log(x+Math.sqrt(x*x-1)); }
function ATanH(x) { return 0.5*Math.log((1+x)/(1-x)); }
function ACotH(x) { return 0.5*Math.log((x+1)/(x-1)); }
function ASecH(x) { return Math.log(1/x+Math.sqrt(1/(x*x)+1)); }
function ACscH(x) { return Math.log(1/x+Math.sqrt(1/(x*x)-1)); }

function ChiSq(x,n) {
    var p=Math.exp(-0.5*x); 
    if((n%2)==1) { 
    	p=p*Math.sqrt(2*x/Pi);
    	}
    var k=n; 
    while(k>=2) { 
    	p=p*x/k; 
    	k=k-2;
    	}
    var t=p; 
    var a=n; 
    while(t>0.00000001*p) {
    	a=a+2; 
    	t=t*x/a; 
    	p=p+t;
    	}
    return 1-p;
    }
function Norm(z) { return ChiSq(z*z,1); }

function Gauss(z) { return ( (z<0) ? ( (z<-6) ? 0 : ChiSq(z*z,1)/2 ) : ( (z>6) ? 1 : 1-ChiSq(z*z,1)/2 ) ); }

function Erf(z) { return Gauss(1.41421356*z); }

function StudT(t,n) {
    t=Math.abs(t); 
    var w=t/Math.sqrt(n); 
    var th=Math.atan(w);
    if(n==1) { 
    	return 1-th/PiD2;
    	}
    var sth=Math.sin(th); 
    var cth=Math.cos(th);
    if((n%2)==1){ 
    	return 1-(th+sth*cth*StatCom(cth*cth,2,n-3,-1))/PiD2;
    	}
    else{ 
    	return 1-sth*StatCom(cth*cth,1,n-3,-1);
    	}
    }
function FishF(f,n1,n2) {
    var x=n2/(n1*f+n2);
    if((n1%2)==0) { 
    	return StatCom(1-x,n2,n1+n2-4,n2-2)*Math.pow(x,n2/2);
    	}
    if((n2%2)==0){ 
    	return 1-StatCom(x,n1,n1+n2-4,n1-2)*Math.pow(1-x,n1/2);
    	}
    var th=Math.atan(Math.sqrt(n1*f/n2)); 
    var a=th/PiD2; 
    var sth=Math.sin(th); 
    var cth=Math.cos(th);
    if(n2>1) { 
    	a=a+sth*cth*StatCom(cth*cth,2,n2-3,-1)/PiD2;
    	}
    if(n1==1) { 
    	return 1-a;
    	}
    var c=4*StatCom(sth*sth,n2+1,n1+n2-4,n2-2)*sth*Math.pow(cth,n2)/Pi;
    if(n2==1) { 
    	return 1-a+c/2;
    	}
    var k=2; 
    while(k<=(n2-1)/2) {
    	c=c*k/(k-.5); 
    	k=k+1;
    	}
    return 1-a+c;
    }
function StatCom(q,i,j,b) {
    var zz=1; 
    var z=zz; 
    var k=i; 
    while(k<=j) { 
    	zz=zz*q*k/(k-b); 
    	z=z+zz; 
    	k=k+2;
    	}
    return z;
    }
function ANorm(p) { 
	var v=0.5; 
	var dv=0.5; 
	var z=0;
    while(dv>1e-6) {
    	z=1/v-1; 
    	dv=dv/2; 
    	if(Norm(z)>p) {
    		v=v-dv; 
    		} 
    	else {
    		v=v+dv; 
    		} 
    	}
    return z;
    }
function AChiSq(p,n) { 
	var v=0.5; 
	var dv=0.5; 
	var x=0;
    while(dv>1e-6) {
    	x=1/v-1; 
    	dv=dv/2; 
    	if(ChiSq(x,n)>p) {
    		v=v-dv;
    		} 
    	else {
    		v=v+dv;
    		} 
    	}
    return x;
    }
function AStudT(p,n) {
	var v=0.5; 
	var dv=0.5; 
	var t=0;
    while(dv>1e-6) {
    	t=1/v-1; 
    	dv=dv/2; 
    	if(StudT(t,n)>p) {
    		v=v-dv;
    		} 
    	else {
    		v=v+dv;
    		} 
    	}
    return t;
    }
function AFishF(p,n1,n2) { 
	var v=0.5; 
	var dv=0.5; 
	var f=0;
    while(dv>1e-6) {
    	f=1/v-1; 
    	dv=dv/2; 
    	if(FishF(f,n1,n2)>p) {
    		v=v-dv;
    		} 
    	else {
    		v=v+dv;
    		} 
    	}
    return f;
    }
function Max(x1,x2) { 
	return (x1>x2)?x1:x2;
	}
function Min(x1,x2) {
	return (x1<x2)?x1:x2;
	}

function Fmt(x) { 
	var v;
	if(Abs(x)<0.00005) {
		x=0;
		}
	if(x>=0) {
		v='          '+(x+0.00005); 
		} 
	else { 
		v='          '+(x-0.00005);
		}
	v = v.substring(0,v.indexOf('.')+5);
	return v.substring(v.length-10,v.length);
	}

function vFmt(x) { 
	var v;
	if(Abs(x)<0.0000005) {
		x=0;
		}
	if(x>=0) {
		v='              '+(x+0.0000005);
		} 
	else { 
		v='          '+(x-0.0000005);
		}
	v = v.substring(0,v.indexOf('.')+7);
	return v.substring(v.length-14,v.length);
	}

function createArray() {
	this.length = createArray.arguments.length;
	for (var i = 0; i < this.length; i++) {
		this[i] = createArray.arguments[i];
		}
	}

function ix(j,k) { 
	return j*(nPar+1)+k;
	}






