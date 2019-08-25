namespace Instacram.Models {
    public class LikePost {
        public int LikerId { get; set; }
        public int PostId { get; set; }
        public virtual User Liker { get; set; }
        public virtual Post Post { get; set; }
    }
}