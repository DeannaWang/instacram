using System;
using System.Collections.Generic;

namespace Instacram.Models {
    public class Post {
        public int Id { get; set; }
        public int AuthorId { get; set; }
        public string Description_text { get; set; }
        public double Published { get; set; }
        public string Thumbnail { get; set; }
        public string Src { get; set; }
        public virtual User Author { get; set; }
        public virtual HashSet<LikePost> Likers { get; set; }
        public static double GetPublished () {
            DateTime origin = new DateTime (1970, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc);
            TimeSpan diff = DateTime.Now.ToUniversalTime () - origin;
            return Math.Round (diff.TotalSeconds);
        }
    }
}