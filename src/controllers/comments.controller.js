import CommentsService from '../services/comments.service';
import { ApplicationError } from '../helpers/errors.helper';
import { SendKeywordAlert } from '../services/alert/alert.service';

const getPagination = (page, size) => {
  const limit = size ? +size : 3;
  const offset = page ? page * limit : 0;
  return { limit, offset };
};

const getPagingData = (data, page, limit) => {
  const { count: total, rows: comments } = data;
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(total / limit);
  return { total, comments, totalPages, currentPage };
};

export default {
  /**
   * 댓글 리스트 조회
   * @param req
   * @param res
   * @return {Promise<void>}
   */
  findAllComments: async (req, res) => {
    try {
      const { boardId, page, size } = req.query;
      const { limit, offset } = getPagination(page, size);
      const data = await CommentsService.find(boardId, limit, offset);

      res.status(200).json({
        message: '댓글 리스트 조회 성공',
        data: getPagingData(data, page, limit),
      });
    } catch (error) {
      throw new ApplicationError(500, error);
    }
  },
  /**
   * 댓글 추가
   * @param req
   * @param res
   * @return {Promise<void>}
   */
  createComments: async (req, res, next) => {
    const { boardId, msg, owner, pcId } = req.body;
    let comments = '';

    try {
      if (!pcId) {
        comments = await CommentsService.create(boardId, msg, owner);
      } else {
        comments = await CommentsService.createSubComments(
          boardId,
          msg,
          owner,
          pcId,
        );
      }

      /**
       * 키워드 알림은 비동기처리
       * 정확한 비동기 설명은 README에 남겨놓겠습니다.
       */
      SendKeywordAlert(msg);

      res.status(200).json({
        message: '댓글 추가 성공',
        data: { comments },
      });
    } catch (error) {
      if (error instanceof ApplicationError) {
        res.status(error.statusCode).json(error.message);
      } else {
        next(error);
      }
    }
  },
};
