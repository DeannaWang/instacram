using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Instacram.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Instacram.Controllers {
    [Authorize]
    [ApiController]
    [Route ("[controller]")]
    public class UserController : ControllerBase {
        // GET user/
        [HttpGet]
        public ActionResult Get ([FromQuery] int id = -1, string username = null) {
            using (var context = new InstacramDbContext ()) {
                if (id == -1 && username == null)
                    return Ok (context.GetFormattedUser (Int32.Parse (this.User.Identity.Name)));
                if (id != -1 && username != null)
                    return BadRequest ("Malformed Request");
                var user = context.GetUserById (id) ?? context.GetUserByUsername (username);
                if (user == null)
                    return NotFound ("User Not Found");
                return Ok (context.GetFormattedUser (user.Id));
            }
        }

        [HttpPut ("follow")]
        public ActionResult Follow ([FromQuery] string username = null) {
            using (var context = new InstacramDbContext ()) {
                if (username == null) return BadRequest ("Malformed Request");
                var user = context.GetUserByUsername (username);
                if (user == null) return NotFound ("User Not Found");
                context.AddFollow (Int32.Parse (this.User.Identity.Name), user.Id);
                return Ok ("Success");
            }
        }

        [HttpPut ("unfollow")]
        public ActionResult Unfollow ([FromQuery] string username = null) {
            using (var context = new InstacramDbContext ()) {
                if (username == null) return BadRequest ("Malformed Request");
                var user = context.GetUserByUsername (username);
                if (user == null) return Ok ();
                context.RemoveFollow (Int32.Parse (this.User.Identity.Name), user.Id);
                return Ok ("Success");
            }
        }

        [HttpPut]
        public ActionResult Put ([FromBody] User user) {
            using (var context = new InstacramDbContext ()) {
                if ((user.Email ?? user.Name ?? user.Password) == null)
                    return BadRequest ("Malformed user object");
                context.EditUser (
                    Int32.Parse (this.User.Identity.Name),
                    user.Password,
                    user.Email,
                    user.Name);
                return Ok ("Success");
            }
        }

        [HttpGet ("feed")]
        public ActionResult Feed ([FromQuery] int p = 0, int n = 10) {
            using (var context = new InstacramDbContext ()) {
                return Ok (new {
                    posts = context.GetUserFeed (Int32.Parse (this.User.Identity.Name), p, n)
                });
            }
        }
    }
}