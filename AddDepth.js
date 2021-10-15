var SCRIPT_TITLE = "Add Depth";

function getClientInfo() {
  return {
    "name": SV.T(SCRIPT_TITLE),
    "author": "ZYFXzz",
    "versionNumber": 0.1,
    "minEditorVersion": 66048
  }
}

//function getTranslations(langCode) {
//  if(langCode == "ja-jp") {
//    return [
//      ["Remove Short Silences", "短い無声区間を取り除�?"],
//      ["Threshold", "しきい�??"],
//      ["Scope", "スコープ"],
//      ["Selected Notes", "選択されたノート"],
//      ["Current Track", "現在のトラッ�?"],
//      ["Entire Project", "プロジェクト全体"],
//    ];
//  }
//  return [];
//}

function sortNotes(arr_notes) {
  return arr_notes.sort(function(a,b) {
    if(a.getOnset() < b.getOnset()) return -1;
    if(a.getOnset() > b.getOnset()) return 1;
    return 0;
  });
}

function noteGetter(arr_like, index) {
  if(Array.isArray(arr_like)) {
    return arr_like[index];
  } else {
    // the input is a NoteGroup
    return arr_like.getNote(index);
  }
}

function processNoteSequence(arr_like, N, threshold) {
  for(var i = 1; i < N; i ++) {
    var currOnset = noteGetter(arr_like, i).getOnset();
    var prevEnd = noteGetter(arr_like, i - 1).getEnd();
    if(currOnset != prevEnd && 
      currOnset - prevEnd < SV.QUARTER * threshold) {
      var prevOnset = noteGetter(arr_like, i - 1).getOnset();
      noteGetter(arr_like, i - 1).setDuration(currOnset - prevOnset);
    }
  }
}

function main() {
  var myForm = {
    "title" : SV.T("Add Depth"),
    "buttons" : "OkCancel",
    "widgets" : [
      {
        "name" : "length", "type" : "Slider",
        "label" : SV.T("Length"),
        "format" : "%.0f/32 Quarters",
        "minValue" : 1,
        "maxValue" : 32,
        "interval" : 1,
        "default" : 4
      },
      {
        "name" : "scope", "type" : "ComboBox",
        "label" : SV.T("Scope"),
        "choices" : [SV.T("Selected Notes"), SV.T("Current Track"), 
          SV.T("Entire Project")],
        "default" : 0
      },
      {
          "name" : "depth", "type" : "Slider",
        "label" : SV.T("Depth"),
        "format" : "%.0f/6 Keys",
        "minValue" : 1,
        "maxValue" : 6,
        "interval" : 1,
        "default" : 2
        
      }
    ]
  };

  var result = SV.showCustomDialog(myForm);
  var length = result.answers.length / 32.0;
  var depth =result.answers.depth;

    
    if(result.status == 1) {
    
    if(result.answers.scope == 0) {
      var selection = SV.getMainEditor().getSelection();
      var selectedNotes = sortNotes(selection.getSelectedNotes());
      var scope = SV.getMainEditor().getCurrentGroup();
      var group = scope.getTarget();
      
      var playhead = SV.getPlayback().getPlayhead();
      var timeAxis = SV.getProject().getTimeAxis();
      var playheadBlicks = timeAxis.getBlickFromSeconds(playhead) - scope.getTimeOffset();
      
      for(var i = 0; i < selectedNotes.length; i ++) {
      var note = selectedNotes[i];
      var originalOnset = note.getOnset();
      var originalEnd = note.getEnd();
      var fullDuration = note.getDuration();

    // Skip very short notes.
      if(fullDuration < SV.QUARTER / 16)
      continue;
    
    // Split in the middle by default.
    var durationLeft = Math.round(length*SV.QUARTER);
////    // Split at playhead position if intersects.
    if(playheadBlicks > originalOnset && playheadBlicks < originalEnd)
      durationLeft = playheadBlicks - originalOnset;
    
    // The left note after splitting.
    note.setDuration(durationLeft);
    var notPitch=note.getPitch();
    note.setPitch(notPitch-depth);
    // The right note after splitting.
    var splitted = SV.create("Note");
    splitted.setPitch(notPitch);
    splitted.setTimeRange(note.getEnd(), originalEnd - note.getEnd());
    splitted.setLyrics("-");
    group.addNote(splitted);
    selection.selectNote(splitted);
  }
    } 
     
    }
  
  SV.finish();




 
}
