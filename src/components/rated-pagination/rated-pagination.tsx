//@ts-nocheck

import { Pagination } from "antd";

const RatedPagination = ({
  currentRatedPage,
  pageSize,
  totalRatedMovies,
  handlePageChange,
}) => (
  <Pagination
    showSizeChanger={false}
    current={currentRatedPage}
    pageSize={pageSize}
    total={totalRatedMovies}
    onChange={(page) => handlePageChange("", page, "rated")}
  />
);

export default RatedPagination;
