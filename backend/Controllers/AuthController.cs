using System.Net;
using Instacram.Models;
using Instacram.Services;
using Microsoft.AspNetCore.Mvc;

namespace Instacram.Controllers {
    [Route ("[controller]")]
    [ApiController]
    public class AuthController : ControllerBase {
        private IUserService _userService;

        public AuthController (IUserService userService) {
            _userService = userService;
        }

        // POST auth/login
        [HttpPost ("login")]
        public IActionResult Login ([FromBody] User user) {
            if (user.Username == null || user.Password == null)
                return BadRequest ("Missing Username/Password");
            var res = _userService.Authenticate (user.Username, user.Password);

            if (res == null)
                return StatusCode ((int) HttpStatusCode.Forbidden, "Invalid Username/Password");

            return Ok (res);
        }

        // POST auth/signup
        [HttpPost ("signup")]
        public IActionResult Signup ([FromBody] User user) {
            if (user.Username == null || user.Password == null)
                return BadRequest ("Missing Username/Password");
            var res = _userService.Register (user.Username, user.Password, user.Email, user.Name);

            if (res == null)
                return Conflict ("Username Taken");

            return Ok (res);
        }
    }
}