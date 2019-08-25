using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace Instacram.Models {
    public class InstacramDbContext : DbContext {
        public DbSet<User> Users { get; set; }
        public DbSet<Follow> Follows { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<PostComment> PostComments { get; set; }
        public DbSet<LikePost> LikePosts { get; set; }

        public User GetUserById (int userId) {
            return Users.SingleOrDefault (x => x.Id == userId);
        }

        public User GetUserByUsername (string username) {
            return Users.SingleOrDefault (x => x.Username == username);
        }

        public string GetUsernameById (int userId) {
            return GetUserById (userId).Username;
        }

        public object GetFormattedUser (int userId) {
            var user = GetUserById (userId);
            return new {
                id = user.Id,
                    username = user.Username,
                    email = user.Email,
                    name = user.Name,
                    posts = GetUserPosts (userId),
                    following = GetFolloweds (userId),
                    followed_num = GetFollowerCount (userId)
            };
        }

        public object GetUserPosts (int userId) {
            return Posts.Where (p => p.AuthorId == userId).Select (p => p.Id).ToList ();
        }

        public User AddUser (string username, string password, string email, string name) {
            // var user = new User (username, password, email, name);
            var user = new User ();
            user.Username = username;
            user.Password = password;
            user.Email = email;
            user.Name = name;
            Users.Add (user);
            SaveChanges ();
            return user;
        }

        public User EditUser (int userId, string password, string email, string name) {
            var user = GetUserById (userId);
            user.Password = password ?? user.Password;
            user.Email = email ?? user.Email;
            user.Name = name ?? user.Name;
            SaveChanges ();
            return user;
        }

        public Follow AddFollow (int followerId, int followedId) {
            var follow = Follows.SingleOrDefault (f => f.FollowerId == followerId && f.FollowedId == followedId);
            if (follow != null) return follow;
            var follower = GetUserById (followerId);
            var followed = GetUserById (followedId);
            follow = new Follow ();
            follow.Follower = follower;
            follow.Followed = followed;
            Follows.Add (follow);
            SaveChanges ();
            return follow;
        }

        public void RemoveFollow (int followerId, int followedId) {
            var follow = Follows.SingleOrDefault (f => f.FollowedId == followedId && f.FollowerId == followerId);
            if (follow != null) {
                Follows.Remove (follow);
                SaveChanges ();
            }
        }

        public ICollection<int> GetFolloweds (int id) {
            return Follows.Where (f => f.FollowerId == id).Select (f => f.FollowedId).ToList ();
        }

        public int GetFollowerCount (int id) {
            return Follows.Where (f => f.FollowedId == id).Count ();
        }

        public Post GetPostById (int postId) {
            return Posts.SingleOrDefault (x => x.Id == postId);
        }

        public PostComment GetCommentById (int commentId) {
            return PostComments.SingleOrDefault (x => x.Id == commentId);
        }

        public LikePost AddLike (int likerId, int postId) {
            var like_post = LikePosts.SingleOrDefault (l => l.LikerId == likerId && l.PostId == postId);
            if (like_post != null) return like_post;
            var liker = GetUserById (likerId);
            var post = GetPostById (postId);
            like_post = new LikePost ();
            like_post.Liker = liker;
            like_post.Post = post;
            LikePosts.Add (like_post);
            SaveChanges ();
            return like_post;
        }

        public void RemoveLike (int likerId, int postId) {
            var like_post = LikePosts.SingleOrDefault (l => l.LikerId == likerId && l.PostId == postId);
            if (like_post != null) {
                LikePosts.Remove (like_post);
                SaveChanges ();
            }
        }

        public Post AddPost (int authorId, string description_text, string src, string thumbnail) {
            var author = GetUserById (authorId);
            var post = new Post ();
            post.Author = author;
            post.Description_text = description_text;
            post.Thumbnail = thumbnail;
            post.Src = src;
            post.Published = Post.GetPublished ();
            Posts.Add (post);
            SaveChanges ();
            return post;
        }

        public Post EditPost (int postId, string description_text, string src) {
            var post = GetPostById (postId);
            post.Description_text = description_text ?? post.Description_text;
            post.Src = src ?? post.Src;
            SaveChanges ();
            return post;
        }

        public void RemovePost (int postId) {
            var post = GetPostById (postId);
            Posts.Remove (post);
            SaveChanges ();
        }

        public object GetFormattedPost (Post post) {
            return new {
                id = post.Id,
                    meta = new {
                        author = GetUsernameById (post.AuthorId),
                        description_text = post.Description_text,
                        published = post.Published,
                        likes = LikePosts
                        .Where (l => l.PostId == post.Id)
                        .Select (l => l.LikerId)
                        .ToArray ()
                        },
                        thumbnail = post.Thumbnail,
                        src = post.Src,
                        comments = PostComments
                        .Where (c => c.PostId == post.Id)
                        .ToArray ()
                        .Select (c => GetFormattedComment (c.Id))
                        .ToArray ()
            };
        }

        public object GetUserFeed (int userId, int p, int n) {
            var feed = Follows
                .Where (f => f.FollowerId == userId)
                .Select (f => Posts.Where (pt => pt.AuthorId == f.FollowedId).ToList ())
                .SelectMany (pt => pt)
                .OrderByDescending (pt => pt.Published)
                .ToList ()
                .Select (pt => GetFormattedPost (pt))
                .ToList ();
            return n < feed.Count - p ?
                feed.GetRange (p, n) :
                (feed.Count - p > 0 ?
                    feed.GetRange (p, feed.Count - p) :
                    new List<object> ());
        }

        public PostComment AddComment (int authorId, int postId, string comment) {
            var author = GetUserById (authorId);
            var post = GetPostById (postId);
            var post_comment = new PostComment ();
            post_comment.AuthorObj = author;
            post_comment.Post = post;
            post_comment.Comment = comment;
            post_comment.Published = Post.GetPublished ();
            PostComments.Add (post_comment);
            SaveChanges ();
            return post_comment;
        }

        public object GetFormattedComment (int commentId) {
            var comment = GetCommentById (commentId);
            return new {
                author = GetUsernameById (comment.AuthorId),
                    published = comment.Published,
                    comment = comment.Comment
            };
        }

        protected override void OnConfiguring (DbContextOptionsBuilder optionsBuilder) {
            base.OnConfiguring (optionsBuilder);
            optionsBuilder.UseSqlite ("Filename=./instacramDB.sqlite");
            //optionsBuilder.UseSqlServer (@"Server=(localdb)\mssqllocaldb;Database=InstacramDB;Trusted_Connection=True;MultipleActiveResultSets=true");
        }

        protected override void OnModelCreating (ModelBuilder modelBuilder) {
            base.OnModelCreating (modelBuilder);

            modelBuilder.Entity<Follow> ()
                .HasOne<User> (f => f.Follower)
                .WithMany (u => u.Followeds)
                .HasForeignKey (f => f.FollowerId)
                .OnDelete (DeleteBehavior.Restrict);

            modelBuilder.Entity<Follow> ()
                .HasOne<User> (f => f.Followed)
                .WithMany (u => u.Followers)
                .HasForeignKey (f => f.FollowedId);

            modelBuilder.Entity<Follow> ()
                .HasKey (f => new { f.FollowerId, f.FollowedId });

            modelBuilder.Entity<Post> ()
                .HasOne (p => p.Author)
                .WithMany ()
                .HasForeignKey (p => p.AuthorId);

            modelBuilder.Entity<LikePost> ()
                .HasOne<User> (l => l.Liker)
                .WithMany (u => u.Likeds)
                .HasForeignKey (l => l.LikerId);

            modelBuilder.Entity<LikePost> ()
                .HasOne<Post> (l => l.Post)
                .WithMany (p => p.Likers)
                .HasForeignKey (l => l.PostId);

            modelBuilder.Entity<LikePost> ()
                .HasKey (l => new { l.LikerId, l.PostId });

            modelBuilder.Entity<PostComment> ()
                .HasOne (c => c.Post)
                .WithMany ()
                .HasForeignKey (c => c.PostId);

            modelBuilder.Entity<PostComment> ()
                .HasOne (c => c.AuthorObj)
                .WithMany ()
                .HasForeignKey (c => c.AuthorId);
        }
    }
}