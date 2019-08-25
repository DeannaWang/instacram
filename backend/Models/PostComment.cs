namespace Instacram.Models {
    public class PostComment {
        public int Id { get; set; }
        public int PostId { get; set; }
        public int AuthorId { get; set; }
        public double Published { get; set; }
        public string Comment { get; set; }
        public virtual Post Post { get; set; }
        public virtual User AuthorObj { get; set; }
    }
}