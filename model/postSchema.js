const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
  username: {type: String , required:true},
  date: { type: Date, default: Date.now },
  commentDesc: {type: String, required:true}
});

const postSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  postTitle: { type: String, required: true },
  postDesc: { type: String, required: true },
  likes: {type: Number, default:"0"},
  comments : [commentSchema]
});

module.exports = mongoose.model('post', postSchema);