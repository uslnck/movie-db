//@ts-nocheck

import { Pagination } from "antd";

const SearchPagination = ({
  currentPage,
  pageSize,
  totalMovies,
  handlePageChange,
  currentQuery,
}) => (
  <Pagination
    showSizeChanger={false}
    style={{ paddingBottom: 20 }}
    current={currentPage}
    pageSize={pageSize}
    total={totalMovies}
    onChange={(page) => handlePageChange(currentQuery, page, "search")}
  />
);

export default SearchPagination;
