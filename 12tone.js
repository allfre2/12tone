var SHARPS = ["C ","C#","D ","D#","E ","F ","F#","G ","G#","A ","A#","B "];
var FLATS  = ["C ","Db","D ","Eb","E ","F ","Gb","G ","Ab","A ","Bb","B "];
var notationUsed = FLATS; // Global from HELL!!
// Helper
function mod(a,b){
 return ((a % b) + b) % b;
}

var series = function(s){
  if( s === undefined )
   this.notes = [0,1,2,3,4,5,6,7,8,9,10,11];
  else
   this.notes = s;

  this.transpose = function(note){
   var ret = [note];
   for ( var i = 1; i < 12; ++i )
     ret[i] = mod(note + (this.notes[i] - this.notes[0]), 12);
   return ret;
  };

  this.inverted0 = [this.notes[0]];
  for ( var j = 1; j < 12; ++j )
   this.inverted0[j] = mod ( (2*this.notes[0])-this.notes[j], 12 );

  this.Matrix = [ this.notes ,
                  this.transpose(this.inverted0[1]),
                  this.transpose(this.inverted0[2]),
                  this.transpose(this.inverted0[3]),
                  this.transpose(this.inverted0[4]),
                  this.transpose(this.inverted0[5]),
                  this.transpose(this.inverted0[6]),
                  this.transpose(this.inverted0[7]),
                  this.transpose(this.inverted0[8]),
                  this.transpose(this.inverted0[9]),
                  this.transpose(this.inverted0[10]),
                  this.transpose(this.inverted0[11])];

  this.matrixString = function(){
   var out = "";
   var Irow =  "     ";
    for ( var j = 0; j < 12; ++j ){
     var n = mod (this.Matrix[0][j] - this.Matrix[0][0] , 12 );
     Irow += n + (n > 9?"  ": "   ");
    }
    Irow += "\n\n";
    for ( var i = 0; i < 12; ++i ){
     var n = mod(this.Matrix[i][0]-this.Matrix[0][0],12);
     out += n + (n > 9 ? "  ":"   ");
     for ( var j = 0; j < 12; ++j )
      out +=  " " + notationUsed[this.Matrix[i][j]] + " ";
     out += "\n";
    }
   return Irow + out.replace(/undefined/g,"! ");
  };

  this.consolePrintMatrix = function(){
   console.log(this.matrixString());
  };
};

function _12toneController($scope){
 $scope.notation = notationUsed;
 $scope.s = [0,1,2,3,4,5,6,7,8,9,10,11];
 $scope.serie = new series($scope.s);
 $scope.use_flats = true;
 $scope.updateMatrix = function(pos){
  $scope.serie = new series($scope.s);
 };
 $scope.changeNotation = function(){
  if(notationUsed == FLATS){
   notationUsed = SHARPS;
   $scope.use_flats = false;
  }
  else{
   notationUsed = FLATS;
   $scope.use_flats = true;
  }
  $scope.updateMatrix();
 };
 $scope.random = function(){

  var allnotes = [0,1,2,3,4,5,6,7,8,9,10,11];
  var newserie = [];
  var rand = 0;
  while(allnotes.length > 0){
   rand = Math.floor(Math.random()*3425) % allnotes.length;
   // console.log(rand + " ::  " + allnotes);
   newserie[newserie.length] = allnotes[rand];
   allnotes = allnotes.slice(0,rand).concat(allnotes.slice(rand+1));
  }
  $scope.s = newserie;
  $scope.updateMatrix();
 };
};
