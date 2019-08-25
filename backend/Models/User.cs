using System;
using System.Collections.Generic;

namespace Instacram.Models {

    public class User : IComparable<User> {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string Email { get; set; }
        public string Name { get; set; }

        public virtual HashSet<Follow> Followers { get; set; }
        public virtual HashSet<Follow> Followeds { get; set; }
        public virtual HashSet<LikePost> Likeds { get; set; }
        public int CompareTo (User other) {
            return Id.CompareTo (other.Id);
        }
    }

}