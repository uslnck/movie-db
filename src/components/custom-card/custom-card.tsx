//@ts-nocheck

import { Row, Col, Card, Spin, Rate } from "antd";

const ratingPicker = (vote) => {
  return vote < 1 ? "NR" : vote?.toFixed(1) || "NR";
};

const colorPicker = (vote) => {
  let color = "";
  if (vote >= 0 && vote < 3) {
    color = "#E90000";
  } else if (vote >= 3 && vote < 5) {
    color = "#E97E00";
  } else if (vote >= 5 && vote < 7) {
    color = "#E9D100";
  } else if (vote >= 7) {
    color = "#66E900";
  }
  return color;
};

const CustomCard = ({
  imageLoading,
  genres,
  posterUrl,
  date,
  description,
  title,
  rating,
  vote,
  id,
  handleImageLoadError,
  handleImageLoad,
  handleRatingChange,
}) => (
  <Card
    className="card"
    bodyStyle={{
      paddingBottom: 0,
      paddingTop: 0,
      paddingLeft: 0,
      paddingRight: 0,
    }}
  >
    <div className="rating" style={{ borderColor: colorPicker(vote) }}>
      {ratingPicker(vote)}
    </div>
    <Row gutter={[16, 16]}>
      <Col span={8}>
        <div
          className="poster-container"
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {imageLoading && (
            <Spin
              size="large"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          )}
          <img
            src={posterUrl}
            alt={title}
            onError={handleImageLoadError}
            style={{ height: "100%", width: "100%" }}
            onLoad={handleImageLoad}
            className="poster"
          />
        </div>
      </Col>
      <Col
        span={16}
        style={{
          height: 450,
          paddingBottom: 20,
          paddingTop: 20,
          paddingLeft: 20,
          paddingRight: 40,
        }}
      >
        <h2 className="title">{title}</h2>
        <p className="date">{date}</p>
        <p className="genres">
          {genres?.map((genre, i) => {
            return (
              <span
                className="genre"
                key={i}
                style={{
                  marginRight: 7,
                  paddingLeft: 3,
                  paddingRight: 3,
                }}
              >
                {genre}
              </span>
            );
          })}
        </p>
        <p className="description">{description}</p>
        <Rate
          allowHalf
          defaultValue={rating}
          onChange={(rating) => handleRatingChange(rating, id)}
          count={10}
        />
      </Col>
    </Row>
  </Card>
);

export default CustomCard;
