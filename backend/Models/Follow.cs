namespace Instacram.Models {

    public class Follow {
        public int FollowerId { get; set; }
        public int FollowedId { get; set; }
        public virtual User Follower { get; set; }
        public virtual User Followed { get; set; }
    }
}