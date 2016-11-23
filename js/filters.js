'use strict';

/* Filters */

angular.module('michaelisMenten.filters', []).
  filter('timeFromDecimal', function() {
	  return function(input, uppercase) {
	      var out = Math.floor(input); //integer part of number
	      var decimalPortion = input % 1;  //decinal part
	      var minutes = decimalPortion * 60;
	      if(minutes<10){minutes+='0';}
	      out += ':'+minutes;
	      return out;
	    };
  	});