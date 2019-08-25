using System;
using Instacram.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Instacram.Controllers {
    [Authorize]
    [ApiController]
    [Route ("[controller]")]
    public class PostController : ControllerBase {
        // GET post/
        [HttpGet]
        public ActionResult Get ([FromQuery] int id = -1) {
            using (var context = new InstacramDbContext ()) {
                if (id == -1) return BadRequest ("Malformed Request");
                var post = context.GetPostById (id);
                if (post == null)
                    return NotFound ("Post Not Found");
                return Ok (context.GetFormattedPost (post));
            }
        }

        [HttpPost]
        public ActionResult Post ([FromBody] Post post) {
            using (var context = new InstacramDbContext ()) {
                if (post.Description_text == null || post.Src == null) return BadRequest ("Malformed Request");
                return Ok (new {
                    post_id = context.AddPost (
                        Int32.Parse (this.User.Identity.Name),
                        post.Description_text,
                        post.Src,
                        post.Thumbnail
                    ).Id
                });
            }
        }

        [HttpDelete]
        public ActionResult Delete ([FromQuery] int id = -1) {
            using (var context = new InstacramDbContext ()) {
                if (id == -1) return BadRequest ("Malformed Request");
                var post = context.GetPostById (id);
                if (post == null) return NotFound ("Post Not Found");
                if (post.AuthorId != Int32.Parse (this.User.Identity.Name))
                    return Unauthorized ("You Are Unauthorized To Make That Request");
                context.RemovePost (id);
                return Ok ("Success");
            }
        }

        [HttpPut]
        public ActionResult Put ([FromBody] Post post, [FromQuery] int id = -1) {
            using (var context = new InstacramDbContext ()) {
                if (id == -1 || (post.Description_text == null && post.Src == null))
                    return BadRequest ("Malformed Request");
                var the_post = context.GetPostById (id);
                if (the_post == null) return NotFound ("Post Not Found");
                if (the_post.AuthorId != Int32.Parse (this.User.Identity.Name))
                    return Unauthorized ("You Are Unauthorized To Make That Request");
                context.EditPost (id, post.Description_text, post.Src);
                return Ok ("Success");
            }
        }

        [HttpPut ("comment")]
        public ActionResult Comment ([FromBody] PostComment comment, [FromQuery] int id = -1) {
            using (var context = new InstacramDbContext ()) {
                if (comment.Comment == null || id == -1) return BadRequest ("Malformed Request");
                if (context.GetPostById (id) == null) return NotFound ("Post Not Found");
                context.AddComment (Int32.Parse (this.User.Identity.Name), id, comment.Comment);
                return Ok ("Success");
            }
        }

        [HttpPut ("like")]
        public ActionResult Like ([FromQuery] int id = -1) {
            using (var context = new InstacramDbContext ()) {
                if (id == -1) return BadRequest ("Malformed Request");
                var post = context.GetPostById (id);
                if (post == null) return NotFound ("Post Not Found");
                context.AddLike (Int32.Parse (this.User.Identity.Name), id);
                return Ok ("Success");
            }
        }

        [HttpPut ("unlike")]
        public ActionResult Unlike ([FromQuery] int id = -1) {
            using (var context = new InstacramDbContext ()) {
                if (id == -1) return BadRequest ("Malformed Request");
                var post = context.GetPostById (id);
                if (post == null) return NotFound ("Post Not Found");
                context.RemoveLike (Int32.Parse (this.User.Identity.Name), id);
                return Ok ("Success");
            }
        }
    }
}