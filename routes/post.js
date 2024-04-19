const express = require("express");
const router = express.Router();
const Post = require("../model/postSchema");

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
router.put("/addcomment/:postId", async (req, res) => {
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

module.exports = router;
