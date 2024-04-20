const express = require("express");
const router = express.Router();
const Post = require("../model/postSchema");
const User = require("../model/userSchema");

//get all posts
router.get("/fetch", (req, res) => {
  Post.find()
    .then((posts) => {
      res.json({ success: true, data: posts });
    })
    .catch((err) => {
      res.status(401).json({ success: false, err });
      console.log(err);
    });
});

//add new Post
router.post("/add", async (req, res) => {
  try {
    await Post.create({
      username: req.body.username,
      email: req.body.email,
      postTitle: req.body.postTitle,
      postDesc: req.body.postDesc,
    });
    // console.log(req.body.comments)
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.json({ success: false, err });
  }
});

//delete post
router.delete("/delete/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    const deletedPost = await Post.findOneAndDelete({ _id: postId });

    if (!deletedPost) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found." });
    }

    res.json({ success: true, deletedPost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, err });
  }
});

// Update Post
router.put("/update/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    if (!postId) {
      return res
        .status(400)
        .json({ success: false, message: "PostId parameter is missing" });
    }

    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId },
      {
        postTitle: req.body.postTitle,
        postDesc: req.body.postDesc,
      },
      { new: true }
    );

    if (!updatedPost) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    res.json({ success: true, updatedPost });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Add comment
router.post("/comment/:postId", async (req, res) => {
  const { postId } = req.params;
  const newComment = req.body;

  try {
    // Find the post by postId
    if (!postId) {
      return res
        .status(400)
        .json({ success: false, message: "PostId parameter is missing" });
    }

    const post = await Post.findOne({ _id: postId });

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    // Add the new comment to the post's comments array
    post.comments.push(newComment);

    // Save the updated post
    const updatedPost = await post.save();

    res.json({ success: true, updatedPost });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Add like
router.post("/like/:postId", async (req, res) => {
  const { postId } = req.params;
  const userId = req.body.userId;

  try {
    const post = await Post.findOne({ _id: postId });
    const user = await User.findOne({ _id: userId });

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isPostAlreadyLiked = user.liked_posts.includes(postId);

    //is post already liked
    if (isPostAlreadyLiked){
      return res
      .status(400)
      .json({ success: false, message: "Post already liked" });
    }

    //add post to liked
    user.liked_posts.push(postId);
    const updatedUser = await user.save();

    //increase liked count of post
    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId }, // Use the unique field for the query
      {
        likes: post.likes + 1
      },
      { new: true }
    );

    res.json({ success: true, updatedPost , updatedUser});
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// remove like
router.post("/unlike/:postId", async (req, res) => {
  const { postId } = req.params;
  const userId = req.body.userId;

  try {
    const post = await Post.findOne({ _id: postId });
    const user = await User.findOne({ _id: userId });

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isPostAlreadyLiked = user.liked_posts.includes(postId);

    //is post already liked
    if (!isPostAlreadyLiked){
      return res
      .status(400)
      .json({ success: false, message: "Post Not liked" });
    }

    //add post to liked
    user.liked_posts.splice(user.liked_posts.indexOf(postId));
    const updatedUser = await user.save();

    //increase liked count of post
    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId }, // Use the unique field for the query
      {
        likes: post.likes - 1
      },
      { new: true }
    );

    res.json({ success: true, updatedPost , updatedUser});
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

module.exports = router;
