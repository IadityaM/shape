class FirestoreBatchWriter
  include Sidekiq::Worker

  def perform(objects)
    @objects = retrieve_objects(objects)
    save_objects_in_firestore
  end

  private

  # expects objects in the form of ["klass", "id"]
  def retrieve_objects(objects)
    objects.map do |klass, id|
      klass.classify.constantize.find(id)
    rescue ActiveRecord::RecordNotFound
      # record has already been deleted, no prob...
      logger.debug 'record already deleted.'
    end
  end

  def save_objects_in_firestore
    # TODO: this fails if the number of items (e.g. notifications) is too high
    # so it should actually break down the batch into smaller batches e.g. ~50 each
    FirestoreClient.client.batch do |batch|
      @objects.each do |object|
        next unless object.is_a?(Firestoreable)

        object.store_in_batch(batch)
      end
    end
  end
end
