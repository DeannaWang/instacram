using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using Instacram.Helpers;
using Instacram.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Instacram.Services {
    public interface IUserService {
        Object Authenticate (string username, string password);
        Object Register (string username, string password, string email, string name);
    }

    public class UserService : IUserService {
        private readonly AppSettings _appSettings;

        public UserService (IOptions<AppSettings> appSettings) {
            _appSettings = appSettings.Value;
        }

        private string GenerateToken (User user) {
            var tokenHandler = new JwtSecurityTokenHandler ();
            var key = Encoding.ASCII.GetBytes (_appSettings.Secret);
            var tokenDescriptor = new SecurityTokenDescriptor {
                Subject = new ClaimsIdentity (new Claim[] {
                new Claim (ClaimTypes.Name, user.Id.ToString ())
                }),
                Expires = DateTime.UtcNow.AddMinutes (30),
                SigningCredentials = new SigningCredentials (new SymmetricSecurityKey (key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken (tokenDescriptor);
            string strToken = tokenHandler.WriteToken (token);
            return strToken;
        }

        public Object Authenticate (string username, string password) {
            using (var context = new InstacramDbContext ()) {
                var user = context.Users.SingleOrDefault (x => x.Username == username && x.Password == password);
                // return null if user not found
                if (user == null)
                    return null;

                // authentication successful so generate jwt token
                string strToken = GenerateToken (user);
                return new { token = strToken };
            }
        }

        public Object Register (string username, string password, string email, string name) {
            using (var context = new InstacramDbContext ()) {
                var user = context.GetUserByUsername (username);
                // return null if user not found
                if (user != null)
                    return null;

                // register new user
                // user = new User (username, password, email, name);
                // context.Users.Add (user);
                // context.SaveChanges ();
                user = context.AddUser (username, password, email, name);
                string strToken = GenerateToken (user);
                return new { token = strToken };
            }
        }
    }
}