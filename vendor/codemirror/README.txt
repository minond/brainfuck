Commenting out the following code in brainfuck.js:

  if(state.commentLine === true){
    if(stream.eol()){
      state.commentLine = false;
    }
    return "comment";
  }
